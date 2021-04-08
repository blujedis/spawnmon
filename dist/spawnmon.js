"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spawnmon = void 0;
const command_1 = require("./command");
const utils_1 = require("./utils");
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
    condensed: false
};
class Spawnmon {
    constructor(options) {
        this.commands = new Map();
        this.running = false;
        this.indexes = [];
        this.maxPrefix = 0; // updated before run.
        this.options = { ...SPAWNMON_DEFAULTS, ...options };
        this.handleSignals();
    }
    setMaxPrefix(commands) {
        const max = Math.max(0, ...commands.map(v => v.length));
        this.maxPrefix = max > this.options.prefixMax ? this.options.prefixMax : max;
    }
    prepareOutput(data) {
        data = data.toString();
        if (!/\n$/.test(data))
            data += '\n';
        if (/\n\n$/.test(data))
            data = data.replace(/\n\n$/, '\n');
        return data;
    }
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
     * Outputs data to specified write stream.
     *
     * @param data the data to write out to the write stream.
     * @param shouldKill when true should exist after writing.
     */
    async write(data, shouldKill = false) {
        if (data instanceof Error)
            throw data;
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
    formatPrefix(command, color = this.options.prefixDefaultColor) {
        let prefix = '';
        const cmd = this.commands.get(command);
        // prefix disabled or command is not auto runnable, return empty string.
        if (!this.options.prefix || !cmd.options.indexed)
            return prefix;
        const template = this.options.prefixTemplate;
        const templateLen = template.replace('{{prefix}}', '').length;
        const adjMax = this.maxPrefix - templateLen;
        prefix = this.options.prefix === 'command' ? command : this.getIndex(command) + '';
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
    /**
     * Gets the index of a command.
     *
     * @param command the command name to get an index for.
     */
    getIndex(command) {
        return this.indexes.indexOf(command);
    }
    add(nameOrOptions, commandArgs, initOptions, as) {
        if (nameOrOptions instanceof command_1.Command) {
            const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameOrOptions.command;
            this.commands.set(aliasOrName, nameOrOptions);
            if (nameOrOptions.options.indexed)
                this.indexes.push(nameOrOptions.command);
            return nameOrOptions;
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
        if (cmd.options.indexed)
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
    handleSignals() {
        const signals = ['SIGINT', 'SIGHUP', 'SIGTERM'];
        signals.forEach(signal => {
            process.on(signal, () => {
                const output = [];
                [...this.commands.values()].forEach(cmd => {
                    output.push((utils_1.colorize(`${cmd.command} recived signal ${signal}.`, 'dim')));
                });
                this.write('\n' + output.join('\n'));
            });
        });
    }
    /**
     * Helper to enabled catching uncaught and unhanded rejection errors.
     * Typically not needed but can be helpful when issues arise.
     */
    enableUncaughtExceptions() {
        const handler = (err) => this.write(err.stack + '\n');
        const unsubscribe = () => {
            process.off('uncaughtException', handler);
            process.off('unhandledRejection', handler);
        };
        const subscribe = () => {
            process.on('uncaughtException', handler);
            process.on('unhandledRejection', handler);
            return unsubscribe;
        };
        // Ensure initially disabled.
        unsubscribe();
        // subscribe and return unsubscribe.
        return subscribe();
    }
}
exports.Spawnmon = Spawnmon;
//# sourceMappingURL=spawnmon.js.map