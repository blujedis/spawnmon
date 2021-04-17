import spawn from 'cross-spawn';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { Spawnmon } from './spawnmon';
import treekill from 'tree-kill';
import { colorize, createError, ensureDefaults, } from './utils';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
const COMMAND_DEFAULTS = {
    command: '',
    args: [],
    condensed: false,
    delay: 0,
    runnable: true
};
export class Command {
    constructor(options, spawnmon, parent) {
        this.timerHandlers = [];
        this.pingerHandlers = [];
        this.subscriptions = [];
        const { defaultColor, condensed, outputExitCode } = spawnmon.options;
        options = {
            color: defaultColor,
            condensed,
            outputExitCode,
            ...options
        };
        options = ensureDefaults(options, COMMAND_DEFAULTS);
        const { pinger, timer } = options;
        if (/^win/.test(process.platform))
            options.detached = false;
        // Timer/Pinger set to "active: false" because
        // when used internally must call method 
        // to enable as active.
        if (pinger) {
            this.pinger = new Pinger(typeof pinger === 'function'
                ? { active: false, onConnected: pinger }
                : { active: false, ...pinger });
        }
        if (timer) {
            this.timer = new SimpleTimer(typeof timer === 'function'
                ? { active: false, onCondition: timer }
                : { active: false, ...timer });
        }
        // If group(s) were provided in 
        // config assign it here.
        if (options.group) {
            if (!Array.isArray(options.group))
                options.group = [options.group];
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
        const _env = { ...process.env, ...env };
        const options = { uid, gid, env: _env, cwd, ...rest };
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
            fromEvent(input, 'error')
                .subscribe(err => {
                // DO NOT allow muting of errors.
                // this.process = undefined;
                this.log(err, false, true);
            });
        }
        else if (from === 'close') {
            fromEvent(input, 'close')
                .subscribe(([code, signal]) => {
                // if not muted and not handled signal output.
                if (!this.options.mute && !['SIGTERM', 'SIGINT', 'SIGHUP'].includes(signal) && this.options.outputExitCode) {
                    const msg = `${this.name} exited with code ${code}\n`;
                    this.spawnmon.options.writestream.write(colorize(msg, 'dim'));
                }
                this.kill(signal);
            });
        }
        else {
            transform = transform || this.transform;
            subscription =
                fromEvent(input, 'data')
                    .pipe(map(e => transform(e, metadata)))
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
        const args = this.prepare;
        this.process = spawn(...args);
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
        if (pinger) {
            if (!this.pinger)
                this.pinger = new Pinger(pinger);
            // If pinger contains a target command bind it.
            if (typeof pinger === 'object' && pinger.target)
                this.onConnect(pinger.target);
        }
        if (timer) {
            if (!this.timer)
                this.timer = new SimpleTimer(timer);
            // If timer contains a target command bind it.
            if (typeof timer === 'object' && timer.target)
                this.onTimeout(timer.target);
        }
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
     * @param shouldUpdate when true should update the timer which watches for idle commands
     * @param stopTimer whether to stop update timer.
     */
    log(data, shouldUpdate = true, stopTimer = false) {
        if (shouldUpdate)
            this.updateTimer(data, stopTimer);
        this.spawnmon.log(data, this);
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
     * Mute's output for this command.
     */
    mute() {
        this.options.mute = true;
        return this;
    }
    /**
     * Unmute's output for this command.
     */
    unmute() {
        this.options.mute = false;
        return this;
    }
    /**
     * When true calling run this command is auto runnable, when false
     * the command name must be manually called.
     *
     * @param state the auto runnable state.
     */
    runnable(state) {
        this.options.runnable = state;
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
    setTimeout(optionsOrInterval, timeout) {
        let options = optionsOrInterval;
        if (typeof optionsOrInterval === 'string') {
            options = {
                interval: optionsOrInterval,
                timeout
            };
        }
        this.options.timer = options;
        return this;
    }
    setConnect(optionsOrHost, port, attempts) {
        let options = optionsOrHost;
        if (typeof optionsOrHost === 'string') {
            options = {
                host: optionsOrHost,
                port,
                attempts
            };
        }
        this.options.pinger = options;
        return this;
    }
    onConnect(handlerCmdOrHost) {
        let handler = handlerCmdOrHost;
        if (typeof handlerCmdOrHost === 'string' || handlerCmdOrHost instanceof Command) {
            const cmd = this.spawnmon.get(handlerCmdOrHost);
            if (!cmd)
                throw createError(`Failed to create Pinger handler using unknown command.`);
            handler = (update, counters) => {
                cmd.run();
            };
        }
        this.pinger.on('connected', handler);
        this.pinger.enable();
        return this;
    }
    onTimeout(handlerOrCommand) {
        let handler = handlerOrCommand;
        if (typeof handlerOrCommand === 'string' || handlerOrCommand instanceof Command) {
            const cmd = this.spawnmon.get(handlerOrCommand);
            if (!cmd)
                throw createError(`Failed to create Timer handler using unknown command.`);
            handler = (update, counters) => {
                cmd.run();
            };
        }
        this.timer.on('condition', handler);
        this.timer.enable();
        return this;
    }
    child(nameCmdOrOpts, commandArgs, initOptsOrAs, as) {
        // Create Spawnmon Child instance to manage subcommands.
        if (!this.spawnmonChild)
            this.spawnmonChild = new Spawnmon({ ...this.spawnmon.options });
        const cmd = this.spawnmonChild.add(nameCmdOrOpts, commandArgs, initOptsOrAs, as);
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
            this.log(colorize(`command ${this.name} is muted.`, 'yellow'), false, false);
        if (!this.options.delay)
            return this.spawnCommand(transform);
        this.delayTimeoutId = setTimeout(() => this.spawnCommand(transform), this.options.delay);
        return this;
    }
    /**
     * Kills the command if process still exists.
     */
    kill(signal) {
        // some cleanup not really needed.
        clearTimeout(this.delayTimeoutId);
        if (this.subscriptions.length)
            this.unsubscribe();
        if (this.timer)
            this.timer.stop();
        if (this.pinger)
            this.pinger.stop();
        !!this.process && treekill(this.pid, signal, (err) => {
            if (err) {
                colorize(err.message, 'red');
                console.log(err.message);
            }
            this.process = undefined;
            this.spawnmon.commands.delete(this.name);
            // If no more commands exit.
            // perhaps we should create a close
            // queue instead, sub to that kill when
            // empty.
            if (!this.spawnmon.commands.size)
                process.exit();
        });
    }
}
//# sourceMappingURL=command.js.map