"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const tree_kill_1 = __importDefault(require("tree-kill"));
const utils_1 = require("./utils");
const pinger_1 = require("./pinger");
const timer_1 = require("./timer");
const COMMON_DEFAULTS = {
    command: '',
    args: [],
    condensed: false,
    delay: 0,
    indexed: true
};
class Command {
    constructor(options, spawnmon) {
        this.subscriptions = [];
        const { prefixDefaultColor, condensed } = spawnmon.options;
        options = { ...COMMON_DEFAULTS, color: prefixDefaultColor, condensed, ...options };
        let { pinger, timer } = options;
        if (pinger) {
            if (!(pinger instanceof pinger_1.Pinger))
                pinger = new pinger_1.Pinger(pinger);
        }
        if (timer) {
            if (!(timer instanceof timer_1.SimpleTimer))
                timer = new timer_1.SimpleTimer(timer);
        }
        this.options = options;
        this.spawnmon = spawnmon;
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
    write(data, shouldKill = false) {
        if (typeof data === 'string')
            data = this.format(data);
        this.updateTimer(shouldKill);
        this.spawnmon.write(data, shouldKill);
    }
    /**
     * Gets the line prefix if enabled.
     */
    getPrefix(unpadded = false) {
        const prefix = this.spawnmon.formatPrefix(this.command, this.options.color);
        if (unpadded)
            return prefix;
        return prefix + ' ';
    }
    /**
     * Checks if out put should be condensed.
     *
     * @param data the data to inspect for condensed format.
     */
    format(data) {
        const prefix = this.getPrefix();
        //  data = data.replace(/\u2026/g, '...');
        let lines = data.split('\n');
        const lastIndex = lines.length - 1;
        lines = lines.reduce((results, line, index) => {
            // Empty line condensed on ignore it.
            if (this.options.condensed && (utils_1.isBlankLine(line) || !line.length))
                return results;
            const inspect = line.replace(/[^\w]/gi, '').trim();
            if (lines.length > 1 && lastIndex === index && !inspect.length)
                return results;
            // Ansi escape resets color that may wrap from preceeding line.
            line = '\u001b[0m' + prefix + line;
            return [...results, line.trim()];
        }, []);
        // need to tweak this a bit so we don't get random prefix with blank line.
        return lines.join('\n').trim();
    }
    /**
     * Updates the timer issuing a new tick for the counters.
     *
     * @param stop when true tells timer to stop.
     */
    updateTimer(stop = false) {
        if (!this.timer)
            return;
        if (stop)
            return this.timer.stop();
        this.timer.update();
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
        const metadata = {
            command: this.command,
            from
        };
        if (from === 'stdin') {
            rxjs_1.fromEvent(input, 'data')
                .subscribe(v => {
                if (this.stdin && this.child) {
                    console.log('got input - ', v.toString());
                    this.stdin.write(v.toString());
                }
            });
        }
        else if (from === 'error') {
            rxjs_1.fromEvent(input, 'error')
                .subscribe(err => {
                // DO NOT allow muting of errors.
                this.child = undefined;
                this.write(err, true);
            });
        }
        else if (from === 'close') {
            rxjs_1.fromEvent(input, 'close')
                .subscribe(code => {
                if (!this.options.mute)
                    this.write(`${this.command} exited with code ${code}`);
                this.child = undefined;
            });
        }
        else {
            transform = transform || this.transform;
            subscription =
                rxjs_1.fromEvent(input, 'data')
                    .pipe(operators_1.map(e => transform(utils_1.chomp(e), metadata)))
                    .subscribe(v => {
                    if (!this.options.mute)
                        this.write(v);
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
        this.child = cross_spawn_1.default(...this.prepare);
        this.child.stdout && this.subscribe('stdout', this.child.stdout, transform);
        this.child.stderr && this.subscribe('stderr', this.child.stderr, transform);
        this.stdin = this.child.stdin;
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
        this.subscriptions.forEach(sub => {
            if (!sub.closed)
                sub.unsubscribe();
        });
        return this;
    }
    setPinger(optionsOrCallback, onConnected) {
        if (this.pinger)
            return this;
        let options = optionsOrCallback;
        if (typeof optionsOrCallback === 'function') {
            onConnected = optionsOrCallback;
            optionsOrCallback = undefined;
        }
        else if (typeof optionsOrCallback === 'number') {
            options = {
                timeout: optionsOrCallback
            };
        }
        this.pinger = new pinger_1.Pinger({
            name: this.command,
            onConnected,
            ...options
        });
        return this;
    }
    setTimer(optionsOrCallback, onCondition) {
        if (this.timer)
            return this.timer;
        let options = optionsOrCallback;
        if (typeof optionsOrCallback === 'function') {
            onCondition = optionsOrCallback;
            optionsOrCallback = undefined;
        }
        else if (typeof optionsOrCallback === 'boolean') {
            options = {
                interval: optionsOrCallback,
            };
        }
        this.timer = new timer_1.SimpleTimer({
            name: this.command,
            onCondition,
            ...options
        });
        const msg = `${this.command} timer expired before condition.`;
        this.timer.on('timeout', () => this.write(utils_1.colorize(msg, 'yellow')));
        return this.timer;
    }
    runConnected(nameOrOptions, commandArgs, initOptions, as) {
        let cmd = nameOrOptions;
        // lookup command or create.
        if (typeof nameOrOptions === 'string')
            cmd = this.spawnmon.commands.get(nameOrOptions);
        // if we get here this is a new command
        // with args, options etc call parent add
        // but specify not to index.
        if (!cmd && typeof nameOrOptions !== 'undefined') {
            // Just some defaults so the add function 
            // knows how to handle. 
            initOptions = {
                indexed: false,
                ...initOptions
            };
            // No need to worry about positions of args here
            // the .add() method in the core will sort it out.
            cmd = this.spawnmon.add(nameOrOptions, commandArgs, initOptions, as);
        }
        if (!cmd)
            return null;
        this.timer = this.timer || this.setTimer();
        this.timer.on('condition', (elapsed) => {
            console.log('Elapased time', (new Date(elapsed)).toISOString());
        });
        return cmd;
    }
    /**
     * Runs the command.
     *
     * @param transform optional tranform, handy when calling programatically.
     */
    run(transform) {
        if (!this.options.delay)
            return this.spawnCommand(transform);
        this.delayTimeoutId = setTimeout(() => this.spawnCommand(transform), this.options.delay);
        return this;
    }
    /**
     * Kills the command if process still exists.
     */
    kill(signal, cb) {
        // not entirely need but...
        clearTimeout(this.delayTimeoutId);
        if (this.timer)
            this.timer.stop();
        !!this.child && tree_kill_1.default(this.pid, signal, (err) => {
            if (cb)
                cb(err);
        });
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map