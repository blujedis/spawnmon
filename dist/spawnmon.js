"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spawnmon = void 0;
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
class Spawnmon {
    constructor(options) {
        this.commands = new Map();
        this.running = false;
        this.indexes = [];
        this.maxPrefix = 0; // updated before run.
        this.options = { ...SPAWNMON_DEFAULTS, ...options };
        if (this.options.handleSignals)
            this.handleSignals();
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
        const cmd = command && this.getCommand(command);
        let prefix = (cmd && this.formatPrefix(cmd.command, cmd.options.color)) || '';
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
     * Gets process id's of commands.
     */
    get pids() {
        return [...this.commands.values()].map(cmd => cmd.pid);
    }
    /**
     * Essentially a lookup and normalizer in one to find your command.
     *
     * @param command the command name, alias or an instance of Command.
     */
    getCommand(command) {
        if (command instanceof command_1.Command) // nothing to do.
            return command;
        return this.commands.get(command);
    }
    /**
     * Gets the index of a command.
     *
     * @param command the command name, alias or instance to get an index for.
     */
    getIndex(command) {
        if (command instanceof command_1.Command)
            command = command.command;
        return this.indexes.indexOf(command);
    }
    /**
     * Formats the prefix for logging to output stream.
     *
     * @param command the command to get and format prefix for.
     * @param color the color of the prefix if any.
     */
    formatPrefix(command, color = this.options.prefixDefaultColor) {
        let prefix = '';
        const cmd = this.getCommand(command);
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
    add(nameOrOptions, commandArgs, initOptions, as) {
        if (nameOrOptions instanceof command_1.Command) {
            const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameOrOptions.command;
            this.commands.set(aliasOrName, nameOrOptions);
            this.indexes.push(nameOrOptions.command);
            return nameOrOptions;
        }
        if (typeof initOptions === 'string') {
            as = initOptions;
            initOptions = undefined;
        }
        if (typeof commandArgs === 'object' && !Array.isArray(commandArgs) && commandArgs !== null) {
            initOptions = commandArgs;
            commandArgs = undefined;
        }
        let options = nameOrOptions;
        // ensure an array.
        if (typeof commandArgs === 'string')
            commandArgs = [commandArgs];
        options = {
            command: nameOrOptions,
            args: commandArgs,
            ...initOptions
        };
        const cmd = new command_1.Command(options, this);
        const aliasOrName = as || cmd.command;
        this.commands.set(aliasOrName, cmd);
        this.indexes.push(aliasOrName);
        return cmd;
    }
    run(...commands) {
        if (!commands.length)
            commands = [...this.commands.keys()];
        // auto run ONLY indexed commands.
        commands = commands.filter(c => this.indexes.includes(c));
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