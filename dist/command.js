"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const spawnmon_1 = require("./spawnmon");
const tree_kill_1 = __importDefault(require("tree-kill"));
const utils_1 = require("./utils");
const pinger_1 = require("./pinger");
const timer_1 = require("./timer");
const COMMAND_DEFAULTS = {
    command: '',
    args: [],
    condensed: false,
    delay: 0
};
class Command {
    constructor(options, spawnmon, parent) {
        this.timerHandlers = [];
        this.pingerHandlers = [];
        this.subscriptions = [];
        const { defaultColor, condensed } = spawnmon.options;
        options = {
            color: defaultColor,
            condensed,
            timer: {},
            pinger: {},
            ...options
        };
        options = utils_1.ensureDefaults(options, COMMAND_DEFAULTS);
        const { pinger, timer } = options;
        if (/^win/.test(process.platform))
            options.detached = false;
        // Timer/Pinger set to "active: false" because
        // when used internally must call method 
        // to enable as active.
        if (pinger) {
            this.pinger = new pinger_1.Pinger(typeof pinger === 'function'
                ? { active: false, onConnected: pinger }
                : { active: false, ...pinger });
        }
        if (timer) {
            this.timer = new timer_1.SimpleTimer(typeof timer === 'function'
                ? { active: false, onCondition: timer }
                : { active: false, ...timer });
        }
        this.options = options;
        this.spawnmon = spawnmon;
        this.parent = parent;
    }
    /**
     * Prepares options and command arguments.
     * Ensures we're always getting the lastest.
     * looks a mess here but simplifies options
     * object for the user.
     */
    get prepare() {
        const { command, args, transform, color, ...rest } = this.options;
        const { uid, gid, env, cwd } = this.spawnmon.options;
        const options = { uid, gid, env, cwd, ...rest };
        return [command, args, options];
    }
    /**
     * Updates the timer issuing a new tick for the counters.
     *
     * @param stop when true tells timer to stop.
     */
    updateTimer(data, stop = false) {
        if (!this.timer)
            return;
        if (stop)
            return this.timer.stop();
        this.timer.update(data);
    }
    /**
     * Subscribes to a child's stream.
     *
     * @param from the stream the subscription is from.
     * @param input the readable, writable stream or child process.
     * @param transform the transform for output.
     */
    subscribe(from, input, transform) {
        let subscription;
        // if Timer exists ensure it is running.
        if (this.timer && !this.timer.running)
            this.timer.start();
        // if Timer exists ensure it is running.
        if (this.pinger && !this.pinger.socket)
            this.pinger.start();
        const metadata = {
            command: this.name,
            from
        };
        if (from === 'error') {
            rxjs_1.fromEvent(input, 'error')
                .subscribe(err => {
                // DO NOT allow muting of errors.
                this.process = undefined;
                this.log(err, true);
            });
        }
        else if (from === 'close') {
            rxjs_1.fromEvent(input, 'close')
                .subscribe(([code, signal]) => {
                // if not muted and not handled signal output.
                if (!this.options.mute && !['SIGTERM', 'SIGINT', 'SIGHUP'].includes(signal))
                    this.log(`${this.name} exited with ${signal}`);
                this.process = undefined;
            });
        }
        else {
            transform = transform || this.transform;
            subscription =
                rxjs_1.fromEvent(input, 'data')
                    .pipe(operators_1.map(e => transform(e, metadata)))
                    .subscribe(v => {
                    if (!this.options.mute)
                        this.log(v);
                });
        }
        this.subscriptions.push(subscription);
    }
    /**
     * Internal method for spawning command.
     *
     * @param transform optional transform to past to streams.
     */
    spawnCommand(transform) {
        this.process = cross_spawn_1.default(...this.prepare);
        this.process.stdout && this.subscribe('stdout', this.process.stdout, transform);
        this.process.stderr && this.subscribe('stderr', this.process.stderr, transform);
        this.stdin = this.process.stdin;
        this.subscribe('close', this.process);
        this.subscribe('error', this.process);
    }
    /**
     * Some preflight we can't init until right before we run.
     */
    beforeRun() {
        const { pinger, timer } = this.options;
        // If pinger contains a target command bind it.
        if (pinger && typeof pinger === 'object' && pinger.target)
            this.onPinger(pinger.target);
        // If timer contains a target command bind it.
        if (timer && typeof timer === 'object' && timer.target)
            this.onTimer(timer.target);
    }
    /**
     * Gets the process id if active.
     */
    get pid() {
        return this.process.pid;
    }
    /**
     * Gets the command's alias.
     */
    get name() {
        return this.options.as || this.options.command;
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
     * Log response from subscriptions.
     *
     * @param data the data to be logged from the response.
     * @param shouldKill variable indicating Spawnmon should kill children.
     * @param shouldUpdate when true should update the timer which watches for idle commands
     */
    log(data, shouldKill = false, shouldUpdate = true) {
        if (shouldUpdate)
            this.updateTimer(data, shouldKill);
        this.spawnmon.log(data, this, shouldKill);
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
    mute() {
        this.options.mute = true;
        return this;
    }
    unmute() {
        this.options.mute = false;
        return this;
    }
    /**
     * Unsubscribes from all subscriptions.
     */
    unsubscribe() {
        this.subscriptions.forEach(sub => {
            sub && !sub.closed && sub.unsubscribe();
        });
        this.timerHandlers.forEach(handler => {
            if (this.timer)
                this.timer.off('condition', handler);
        });
        this.pingerHandlers.forEach(handler => {
            if (this.pinger)
                this.pinger.off('connected', handler);
        });
        return this;
    }
    onPinger(handler) {
        let _handler = handler;
        if (typeof handler === 'string' || handler instanceof Command) {
            const cmd = this.spawnmon.get(handler);
            if (!cmd)
                throw utils_1.createError(`Failed to create Pinger handler using unknown command.`);
            _handler = (update, counters) => {
                cmd.run();
            };
        }
        this.pinger.on('connected', _handler);
        this.pinger.enable();
    }
    onTimer(handler) {
        let _handler = handler;
        if (typeof handler === 'string' || handler instanceof Command) {
            const cmd = this.spawnmon.get(handler);
            if (!cmd)
                throw utils_1.createError(`Failed to create Timer handler using unknown command.`);
            _handler = (update, counters) => {
                cmd.run();
            };
        }
        this.timer.on('condition', _handler);
        this.timer.enable();
    }
    /**
     * Adds command to a group(s).
     *
     * @param groups the name of the group(s) to add the command to.
     */
    assign(...groups) {
        groups.forEach(g => {
            this.spawnmon.assign(g, this);
        });
        return this;
    }
    /**
     * Unassigns a command from group(s).
     *
     * @param groups the groups to remove/unassign the command from.
     */
    unassign(...groups) {
        groups.forEach(g => {
            this.spawnmon.unassign(g, this);
        });
    }
    child(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        // Create Spawnmon Child instance to manage subcommands.
        if (!this.spawnmonChild)
            this.spawnmonChild = new spawnmon_1.Spawnmon({ ...this.spawnmon.options });
        const cmd = this.spawnmonChild.create(nameCmdOrOpts, commandArgs, initOptsOrAs, as);
        // update with this command as its parent.
        if (cmd)
            cmd.parent = this;
        return this;
    }
    /**
     * Runs the command.
     *
     * @param transform optional tranform, handy when calling programatically.
     */
    run(transform) {
        this.beforeRun();
        if (this.options.mute)
            this.log(utils_1.colorize(`command ${this.name} is muted.`, 'yellow'), false, false);
        if (!this.options.delay)
            return this.spawnCommand(transform);
        this.delayTimeoutId = setTimeout(() => this.spawnCommand(transform), this.options.delay);
        return this;
    }
    /**
     * Kills the command if process still exists.
     */
    kill(signal, cb) {
        // some cleanup not really needed.
        clearTimeout(this.delayTimeoutId);
        if (this.timer)
            this.timer.stop();
        if (this.pinger)
            this.pinger.stop();
        !!this.process && tree_kill_1.default(this.pid, signal, (err) => {
            if (cb)
                cb(err);
        });
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map