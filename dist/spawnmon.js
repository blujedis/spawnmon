"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spawnmon = exports.DEFAULT_GROUP_NAME = void 0;
const supports_color_1 = __importDefault(require("supports-color"));
const command_1 = require("./command");
const utils_1 = require("./utils");
const colorSupport = supports_color_1.default.stdout;
// prefix key names.
const SPAWNMON_DEFAULTS = {
    cwd: process.cwd(),
    writestream: process.stdout,
    transform: (line) => line.toString(),
    prefix: '[{index}]',
    prefixMax: 10,
    defaultColor: 'dim',
    prefixAlign: 'left',
    prefixFill: '.',
    condensed: false,
    handleSignals: true,
    onTimestamp: utils_1.simpleTimestamp
};
exports.DEFAULT_GROUP_NAME = 'default';
class Spawnmon {
    constructor(options) {
        this.indexes = [];
        this.maxPrefix = 0; // updated before run.
        this.commands = new Map();
        this.groups = new Map();
        options = {
            ...SPAWNMON_DEFAULTS,
            ...options
        };
        if (colorSupport)
            options.env = {
                ...options.env,
                FORCE_COLOR: colorSupport.level + ''
            };
        if (options.handleSignals)
            this.handleSignals();
        this.groups.set(exports.DEFAULT_GROUP_NAME, []);
        this.options = options;
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
     * Gets the index of a command.
     *
     * @param command the command name, alias or instance to get an index for.
     * @param group the group to get the index of if none assumes the default.
     */
    getIndex(command, group = exports.DEFAULT_GROUP_NAME) {
        if (command instanceof command_1.Command)
            command = command.name;
        const indexes = this.groups.get(group);
        if (!indexes)
            throw utils_1.createError(`Group ${group} could NOT be found.`);
        return [indexes.indexOf(command), indexes.length];
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
     * Gets the prefix key from known keys in the prefix template.
     */
    getPrefixKey() {
        if (!this.options.prefix)
            return '';
        return this.options.prefix.match(/index|command|pid|timestamp/g)[0] || '';
    }
    /**
     * Sets the maximum allowable prefix VALUE length based on prefix key type.
     * This is NOT based on the length of the entire prefix but rather the
     * defined value e.g. index, command name, pid or timestamp.
     *
     * @param commands list of command names or Command instances.
     */
    setMaxPrefix(commands) {
        // Nothing to do, max prefix is only needed for command labels.
        if (this.getPrefixKey() !== 'command') {
            this.maxPrefix = 0;
            return this.maxPrefix;
        }
        // Iterate and get command name longest length.
        const max = Math.max(0, ...commands.map(cmd => this.get(cmd).name).map(v => v.length));
        // If calculated max is greater then allowable set to allowable defined in options.
        // otherwise set to the max calculated.
        this.maxPrefix = this.options.prefixMax > max ? this.options.prefixMax : max;
        return this.maxPrefix;
    }
    /**
     * Gets and formats the prefix for logging to output stream.
     *
     * @param command the command to get and format prefix for.
     * @param color the color of the prefix if any.
     */
    getPrefix(command, color = this.options.defaultColor, group = exports.DEFAULT_GROUP_NAME) {
        let prefix = '';
        const cmd = this.get(command);
        if (cmd.prefixCache)
            return cmd.prefixCache;
        const prefixKey = this.getPrefixKey();
        // Nothing to do, blank prefix?
        if (!prefixKey)
            return '';
        const template = this.options.prefix;
        const [index, indexesLen] = this.getIndex(cmd, group);
        color = cmd.options.color || color;
        const map = {
            index,
            pid: cmd.pid,
            command: cmd.name,
            timestamp: this.options.onTimestamp()
        };
        if (prefixKey !== 'command') {
            prefix = template.replace(`{${prefixKey}}`, map[prefixKey]) || '';
        }
        else {
            const templateChars = template.replace(prefixKey, '');
            const innerLength = Math.max(0, this.maxPrefix - templateChars.length);
            // only one command just use it's full length unless too long.
            if (indexesLen === 1 && map.command.length <= innerLength) {
                prefix = map.command;
            }
            else {
                prefix = utils_1.truncate(map.command, innerLength, '');
                const offset = innerLength - prefix.length;
                prefix = this.padPrefix(prefix, offset, this.options.prefixAlign);
            }
            prefix = template.replace(`{${prefixKey}}`, prefix);
        }
        if (color)
            prefix = utils_1.colorize(prefix, ...color.split('.'));
        // no need to calculate this again unless timestamp.
        if (prefixKey !== 'timestamp')
            cmd.prefixCache = prefix;
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
        if (this.options.raw)
            return output;
        const cmd = command && this.get(command);
        let prefix = (cmd && this.getPrefix(cmd, cmd.options.color)) || '';
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
     * A lookup and normalizer to find command.
     * For most actions involving finding a command
     * this method should be called as it simplifies the find.
     *
     * @param command the command name, alias or an instance of Command.
     * @param strict when false will get based on alias or command name.
     */
    get(command, strict = false) {
        if (command instanceof command_1.Command)
            return command;
        const cmds = [...this.commands.values()];
        const predicate = (cmd) => {
            if (!strict)
                return cmd.name === command || cmd.command === command;
            return cmd.name === command;
        };
        return cmds.find(predicate);
    }
    /**
     * Checks if a the Spawnmon instance knows of the command.
     *
     * @param command the command name or Command instance.
     */
    has(command) {
        const cmd = this.get(command, false); // strict checks only as in command map
        return this.commands.has((cmd && cmd.name) || undefined);
    }
    /**
     * Ensures that a command exists in the Spawnmon command instance.
     *
     * @param command the command to ensure.
     */
    ensure(command, as) {
        const cmd = this.get(command);
        if (!cmd)
            throw utils_1.createError(`Failed to validate ${command || 'unknown'} command.`);
        cmd.options.as = as || cmd.name;
        if (!this.has(cmd))
            this.commands.set(cmd.name, cmd);
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
    init(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        if (nameCmdOrOpts instanceof command_1.Command) {
            const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameCmdOrOpts.command;
            nameCmdOrOpts.options.as = aliasOrName;
            return nameCmdOrOpts;
        }
        if (typeof initOptsOrAs === 'string') {
            as = initOptsOrAs;
            initOptsOrAs = undefined;
        }
        if (typeof nameCmdOrOpts === 'object' && !Array.isArray(nameCmdOrOpts) && nameCmdOrOpts !== null) {
            initOptsOrAs = nameCmdOrOpts;
            commandArgs = undefined;
            nameCmdOrOpts = undefined;
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
        return cmd;
    }
    create(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        const cmd = this.init(nameCmdOrOpts, commandArgs, initOptsOrAs, as);
        this.ensure(cmd);
        return cmd;
    }
    add(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        const cmd = this.create(nameCmdOrOpts, commandArgs, initOptsOrAs, as);
        // Add to default create.
        cmd.assign(exports.DEFAULT_GROUP_NAME);
        return cmd;
    }
    /**
     * Removes a command from the instance. Not likely to be
     * used but for good measure it's here, also removes from
     * any assigned groups.
     *
     * @param command the command to be removed.
     */
    remove(command) {
        const cmd = this.get(command);
        if (!this.has(cmd))
            return false;
        [...this.groups.keys()].forEach(k => {
            const group = this.groups.get(k);
            this.groups.set(k, group.filter(n => n !== cmd.name));
        });
        return this.commands.delete(cmd.name);
    }
    run(group, ...commands) {
        // If first arg is not a group assume command.
        if (group instanceof command_1.Command || !this.groups.has(group)) {
            commands.unshift(group);
            group = undefined;
        }
        group = group || exports.DEFAULT_GROUP_NAME;
        // If a group is provided use the group's commands.
        commands = (group && this.groups.has(group) ? this.groups.get(group) : commands);
        const cmds = commands.map(cmd => this.get(cmd));
        this.setMaxPrefix(cmds);
        // Run each command.
        cmds.forEach(cmd => cmd.run());
        this.running = cmds;
    }
    kill(...commands) {
        const cmds = commands.length ? commands.map(c => this.get(c)) : [...this.running];
        cmds.forEach(cmd => cmd.kill());
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
                    lines.push(utils_1.colorize(`${cmd.name} recived signal ${signal}.`, 'dim'));
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