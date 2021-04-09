"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spawnmon = exports.DEFAULT_GROUP_NAME = void 0;
const command_1 = require("./command");
const utils_1 = require("./utils");
// Sorce color.
process.env.FORCE_COLOR = '1';
const SPAWNMON_DEFAULTS = {
    writestream: process.stdout,
    transform: (line) => line.toString(),
    prefix: 'index',
    prefixMax: 10,
    prefixDefaultColor: 'dim',
    prefixTemplate: '[{{prefix}}]',
    prefixAlign: 'left',
    prefixFill: '.',
    condensed: false,
    handleSignals: true
};
exports.DEFAULT_GROUP_NAME = 'default';
class Spawnmon {
    constructor(options) {
        this.running = false;
        this.indexes = [];
        this.maxPrefix = 0; // updated before run.
        this.commands = new Map();
        this.groups = new Map();
        this.options = { ...SPAWNMON_DEFAULTS, ...options };
        if (this.options.handleSignals)
            this.handleSignals();
        this.groups.set(exports.DEFAULT_GROUP_NAME, []);
    }
    /**
     * Sets the maximum allowable prefix length based on command names.
     *
     * @param commands list of command names.
     */
    setMaxPrefix(commands) {
        const max = Math.max(0, ...commands.map(v => v.length));
        this.maxPrefix = max > this.options.prefixMax ? this.options.prefixMax : max;
    }
    /**
     * Ensures data is as string and that we don't have unnecessary line returns.
     *
     * @param data the data to be output.
     */
    prepareOutput(data) {
        data = data.toString();
        if (!/\n$/.test(data))
            data += '\n';
        if (/\n\n$/.test(data))
            data = data.replace(/\n\n$/, '\n');
        return data;
    }
    /**
     * Pads the prefix for display in console.
     *
     * @param prefix the prefix to be padded.
     * @param offset the offset in spaces.
     * @param align the alignment for the padding.
     */
    padPrefix(prefix, offset, align = this.options.prefixAlign) {
        if (offset <= 0)
            return prefix; // nothing to do.
        const fill = this.options.prefixFill;
        if (align === 'right')
            prefix = fill.repeat(offset) + prefix;
        else if (align === 'center')
            prefix = fill.repeat(Math.floor(offset / 2)) + prefix + fill.repeat(Math.floor(offset / 2) + offset % 2);
        else
            prefix = prefix + fill.repeat(offset);
        return prefix;
    }
    /**
     * Formats string for log output.
     *
     * @param output the data to be formatted.
     * @param prefix optional prefix for each line.
     * @param condensed indicates output should be condensed removing spaces.
     */
    formatLines(output, command) {
        // Don't format output.
        if (this.options.unformatted)
            return output;
        const cmd = command && this.get(command);
        let prefix = (cmd && this.getPrefix(cmd.command, cmd.options.color)) || '';
        const condensed = cmd && cmd.options.condensed;
        // grabbed from concurrently well played fellas!!!
        // what's funny is when I looked at their source
        // had the immediate ahhh haaa moment :)
        // see https://github.com/kimmobrunfeldt/concurrently/blob/e36e8c18c20a72e4745e481498f21ca00e29a0e7/src/logger.js#L96
        output = output.replace(/\u2026/g, '...');
        if (prefix.length)
            prefix = prefix + ' ';
        let lines = output.split('\n');
        lines = lines.reduce((results, line, index) => {
            // Empty line condensed on ignore it.
            if (condensed && (utils_1.isBlankLine(line) || !line.length))
                return results;
            // const inspect = line.replace(/[^\w]/gi, '').trim();
            if (index === 0 || index === lines.length - 1)
                return [...results, line];
            // Ansi escape resets color that may wrap from preceeding line.
            line = '\u001b[0m' + prefix + line;
            return [...results, line];
        }, []);
        output = lines.join('\n');
        const last = output[output.length - 1];
        if (!this.prevChar || this.prevChar === '\n')
            output = prefix + output;
        this.prevChar = last;
        // need to tweak this a bit so we don't get random prefix with blank line.
        return output;
    }
    /**
     * Gets process id's of commands.
     */
    get pids() {
        return [...this.commands.values()].map(cmd => cmd.pid);
    }
    async log(data, command, shouldKill = false) {
        if (data instanceof Error)
            throw data;
        if (typeof command === 'boolean') {
            shouldKill = command;
            command = undefined;
        }
        data = this.formatLines(data, command);
        await this.options.writestream.write(this.prepareOutput(data));
        if (shouldKill)
            this.kill();
    }
    /**
     * Essentially a lookup and normalizer in one to find your command.
     *
     * @param command the command name, alias or an instance of Command.
     */
    get(command) {
        if (command instanceof command_1.Command)
            return command;
        return [...this.commands.values()] // lookup by name or an alias.
            .find(cmd => cmd.name === command);
    }
    /**
     * Checks if a the Spawnmon instance knows of the command.
     *
     * @param command the command name or Command instance.
     */
    has(command) {
        const cmd = this.get(command);
        return this.commands.has((cmd && cmd.command) || undefined);
    }
    /**
     * Ensures that a command exists in the Spawnmon command instance.
     *
     * @param command the command to ensure.
     */
    ensure(command, as) {
        const cmd = this.get(command);
        if (!cmd)
            throw utils_1.createError(`Failed to ensure unknown command.`);
        cmd.options.as = as || cmd.command;
        if (!this.has(cmd))
            this.commands.set(cmd.command, cmd);
        return this;
    }
    assign(group, commands, merge = false) {
        if (typeof commands === 'string' || commands instanceof command_1.Command)
            commands = [commands];
        commands = commands.map(cmd => this.get(cmd).name);
        if (merge)
            commands = [...(this.groups.get(group) || []), ...commands];
        this.groups.set(group, [...commands]);
        return this;
    }
    unassign(groupOrCommand, commands) {
        let groupName = exports.DEFAULT_GROUP_NAME;
        // First arg is a group name.
        if (typeof groupOrCommand === 'string' && this.groups.get(groupOrCommand)) {
            groupName = groupOrCommand;
        }
        else {
            commands = groupOrCommand;
            groupOrCommand = undefined;
        }
        // ensure the command is of type Array.
        if (typeof commands !== 'undefined' && !Array.isArray(commands))
            commands = [commands];
        let grp = this.groups.get(groupName || exports.DEFAULT_GROUP_NAME);
        // At this point we need to have a group
        if (!grp)
            throw utils_1.createError(`Assign failed, group name ${groupOrCommand} is unknown.`);
        // Ensure commands are string.
        let cmds = commands.map(cmd => this.get(cmd).name);
        cmds = grp.filter(k => !cmds.includes(k));
        this.assign(groupOrCommand, cmds);
        return this;
    }
    /**
     * Gets the index of a command.
     *
     * @param command the command name, alias or instance to get an index for.
     * @param group the group to get the index of if none assumes the default.
     */
    getIndex(command, group = exports.DEFAULT_GROUP_NAME) {
        if (command instanceof command_1.Command)
            command = command.command;
        const indexes = this.groups.get(group);
        if (!indexes)
            throw utils_1.createError(`Group ${group} could NOT be found.`);
        return indexes.indexOf(command);
    }
    /**
     * Gets and formats the prefix for logging to output stream.
     *
     * @param command the command to get and format prefix for.
     * @param color the color of the prefix if any.
     */
    getPrefix(command, color = this.options.prefixDefaultColor) {
        let prefix = '';
        const cmd = this.get(command);
        // prefix disabled or command is not auto runnable, return empty string.
        if (!this.options.prefix)
            return prefix;
        const template = this.options.prefixTemplate;
        const templateLen = template.replace('{{prefix}}', '').length;
        const adjMax = this.maxPrefix - templateLen;
        prefix = this.options.prefix === 'command' ? cmd.command : this.getIndex(cmd) + '';
        // Only truncate if command is used not index, no point.
        if (this.maxPrefix && adjMax > 0 && this.options.prefix === 'command') {
            prefix = prefix.length > adjMax && adjMax > 0
                ? utils_1.truncate(prefix, adjMax, '')
                : prefix;
            const offset = prefix.length > adjMax ? 0 : adjMax - prefix.length;
            prefix = this.padPrefix(prefix, offset);
        }
        prefix = template.replace('{{prefix}}', prefix);
        if (color)
            prefix = utils_1.colorize(prefix, color);
        return prefix;
    }
    create(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        if (nameCmdOrOpts instanceof command_1.Command) {
            const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameCmdOrOpts.command;
            nameCmdOrOpts.options.as = aliasOrName;
            this.commands.set(nameCmdOrOpts.name, nameCmdOrOpts);
            return nameCmdOrOpts;
        }
        if (typeof initOptsOrAs === 'string') {
            as = initOptsOrAs;
            initOptsOrAs = undefined;
        }
        if (typeof commandArgs === 'object' && !Array.isArray(commandArgs) && commandArgs !== null) {
            initOptsOrAs = commandArgs;
            commandArgs = undefined;
        }
        let options = nameCmdOrOpts;
        // ensure an array.
        if (typeof commandArgs === 'string')
            commandArgs = [commandArgs];
        options = {
            command: nameCmdOrOpts,
            args: commandArgs,
            ...initOptsOrAs
        };
        const cmd = new command_1.Command({ as, ...options }, this);
        const aliasOrName = as || cmd.command;
        cmd.options.as = aliasOrName;
        this.commands.set(cmd.name, cmd);
        return cmd;
    }
    add(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        const cmd = this.create(nameCmdOrOpts, commandArgs, initOptsOrAs, as);
        if (this.has(cmd.name))
            throw utils_1.createError(`Duplicate command ${cmd.name} detected.`);
        // Add to default create.
        cmd.assign(exports.DEFAULT_GROUP_NAME);
        return this;
    }
    /**
     * Removes a command from the instance. Not likely to be
     * used but for good measure it's here, also removes from
     * any assigned groups.
     *
     * @param command the command to be removed.
     */
    remove(command) {
    }
    run(group, ...commands) {
        if (!this.groups.has(group))
            commands.unshift(group);
        const normalizedCommands = !commands.length ? this.groups.get(exports.DEFAULT_GROUP_NAME) : commands;
        commands = this.groups.has(group) ? this.groups.get(group) : normalizedCommands;
        this.setMaxPrefix(commands);
        commands.forEach(key => {
            const command = this.commands.get(key);
            setTimeout(() => {
                command.run();
            }, 100);
        });
        this.running = true;
    }
    kill(...names) {
        if (!names.length)
            names = [...this.commands.keys()];
        this.running = false;
        names.forEach(k => {
            const command = this.commands.get(k);
            command.kill();
        });
    }
    /**
     * Handles node signals, useful for cleanup.
     */
    handleSignals() {
        const signals = ['SIGINT', 'SIGHUP', 'SIGTERM'];
        signals.forEach(signal => {
            process.on(signal, () => {
                const lines = [];
                [...this.commands.values()].forEach(cmd => {
                    lines.push(utils_1.colorize(`${cmd.command} recived signal ${signal}.`, 'dim'));
                    cmd.unsubscribe();
                });
                // could write to stdin or line by line but
                // these ends up a bit cleaner in term IMO.
                const output = ('\n' + lines.join('\n'));
                this.log(output, true);
            });
        });
    }
}
exports.Spawnmon = Spawnmon;
//# sourceMappingURL=spawnmon.js.map