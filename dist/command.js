"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const rxjs_1 = require("rxjs");
const COMMON_DEFAULTS = {
    command: '',
    args: []
};
class Command {
    constructor(options, spawnmon) {
        this.subscriptions = [];
        this.options = { ...COMMON_DEFAULTS, ...options };
        this.spawnmon = spawnmon;
    }
    /**
     * Prepares options and command arguments.
     * Ensures we're always getting the lastest.
     */
    get prepare() {
        const { command, args, transform, color, prefix, ...rest } = this.options;
        const { uid, gid, env, cwd } = this.spawnmon.options;
        const options = { uid, gid, env, cwd, ...rest };
        return [command, args, options];
    }
    /**
     * Subscribes to a child's stream.
     *
     * @param from the stream the subscription is from.
     * @param stream the readable stream to get event from.
     * @param transform the transform for output.
     */
    subscribe(from, stream, transform) {
        // .pipe(map(e => e))
        transform = transform || this.transform;
        const subscription = rxjs_1.fromEvent(stream, 'data')
            .subscribe(v => transform(v.toString(), this.command, from));
        this.subscriptions.push(subscription);
    }
    /**
     * Gets the process id if active.
     */
    get pid() {
        return this.child.pid;
    }
    /**
     * Gets the defined command name itself.
     */
    get command() {
        return this.options.command;
    }
    /**
     * Gets the command arguments.
     */
    get args() {
        return this.options.args || [];
    }
    /**
     * Gets the normalized output transform.
     */
    get transform() {
        return this.options.transform || this.spawnmon.options.transform;
    }
    /**
     * Sets the options object.
     *
     * @param options options object to update or set to.
     * @param merge when true options are merged with existing.
     */
    setOptions(options, merge = true) {
        if (merge)
            this.options = { ...this.options, ...options };
        else
            this.options = options;
        return this;
    }
    /**
     * Unsubscribes from all subscriptions.
     */
    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
        return this;
    }
    /**
     * Runs the command.
     *
     * @param transform optional tranform, handy when calling programatically.
     */
    run(transform) {
        this.child = cross_spawn_1.default(...this.prepare);
        this.child.stdout && this.subscribe('stdout', this.child.stdout, transform);
        this.child.stderr && this.subscribe('stderr', this.child.stderr, transform);
        return this;
    }
    /**
     * Kills the command if process still exists.
     */
    kill() {
        this.unsubscribe();
        this.child && this.child.kill();
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map