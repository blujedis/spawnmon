"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spawnmon = void 0;
const command_1 = require("./command");
const SPAWNMON_DEFAULTS = {
    writestream: process.stdout
};
class Spawnmon {
    constructor(options) {
        this.commands = new Map();
        this.options = { ...SPAWNMON_DEFAULTS, ...options };
    }
    get pids() {
        return [...this.commands.values()].map(cmd => cmd.pid);
    }
    /**
     * Writes output to the default or user specified stream.
     *
     * @param data the data to be written.
     */
    async writer(data) {
        const result = await this.options.writestream.write(data);
        if (!result)
            console.error('Whoops failed to write output.');
    }
    add(nameOrOptions, commandArgs, initOptions) {
        let options = nameOrOptions;
        if (typeof nameOrOptions === 'object' && nameOrOptions !== null) {
            initOptions = undefined;
            commandArgs = undefined;
        }
        else {
            options = {
                command: nameOrOptions,
                args: commandArgs,
                ...initOptions
            };
        }
        const cmd = new command_1.Command(options, this);
        this.commands.set(cmd.command, cmd);
        return cmd;
    }
    run(...commands) {
    }
    kill(...names) {
        if (!names.length)
            names = [...this.commands.keys()];
        names.forEach(k => {
            const command = this.commands.get(k);
            command.kill();
        });
    }
    /**
     * Helper to enabled catching uncaught and unhanded rejection errors.
     * Typically not needed but can be helpful when issues arise.
     */
    enableUncaughtExceptions() {
        const handler = (err) => this.writer(err.stack + '\n');
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