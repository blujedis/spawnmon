/// <reference types="node" />
import { Subscription } from 'rxjs';
import { ChildProcess } from 'child_process';
import { Writable } from 'stream';
import { Spawnmon } from './spawnmon';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
import { ICommandOptions, IPingerOptions, ISimpleTimerOptions, PingerHandler, SimpleTimerHandler, TransformHandler } from './types';
export declare class Command {
    private delayTimeoutId;
    private timerHandlers;
    private pingerHandlers;
    spawnmon: Spawnmon;
    parent: Command;
    process: ChildProcess;
    spawnmonChild: Spawnmon;
    subscriptions: Subscription[];
    stdin: Writable;
    prefixCache: string;
    timer: SimpleTimer;
    pinger: Pinger;
    options: ICommandOptions;
    constructor(options: ICommandOptions, spawnmon: Spawnmon, parent?: Command);
    /**
     * Prepares options and command arguments.
     * Ensures we're always getting the lastest.
     * looks a mess here but simplifies options
     * object for the user.
     */
    private get prepare();
    /**
     * Updates the timer issuing a new tick for the counters.
     *
     * @param stop when true tells timer to stop.
     */
    private updateTimer;
    /**
     * Subscribes to a child's stream.
     *
     * @param from the stream the subscription is from.
     * @param input the readable, writable stream or child process.
     * @param transform the transform for output.
     */
    private subscribe;
    /**
     * Internal method for spawning command.
     *
     * @param transform optional transform to past to streams.
     */
    private spawnCommand;
    /**
     * Some preflight we can't init until right before we run.
     */
    private beforeRun;
    /**
     * Gets the process id if active.
     */
    get pid(): number;
    /**
     * Gets the command's alias.
     */
    get name(): string;
    /**
     * Gets the defined command name itself.
     */
    get command(): string;
    /**
     * Gets the command arguments.
     */
    get args(): string[];
    /**
     * Gets the normalized output transform.
     */
    get transform(): TransformHandler;
    /**
     * Log response from subscriptions.
     *
     * @param data the data to be logged from the response.
     * @param shouldUpdate when true should update the timer which watches for idle commands
     * @param stopTimer whether to stop update timer.
     */
    log(data: string | Error, shouldUpdate?: boolean, stopTimer?: boolean): void;
    /**
     * Sets the options object.
     *
     * @param options options object to update or set to.
     * @param merge when true options are merged with existing.
     */
    setOptions(options: ICommandOptions, merge?: boolean): this;
    /**
     * Mute's output for this command.
     */
    mute(): this;
    /**
     * Unmute's output for this command.
     */
    unmute(): this;
    /**
     * When true calling run this command is auto runnable, when false
     * the command name must be manually called.
     *
     * @param state the auto runnable state.
     */
    runnable(state: boolean): void;
    /**
     * Unsubscribes from all subscriptions.
     */
    unsubscribe(): this;
    /**
     * Sets timer options.
     *
     * @param options the timer options to be set.
     */
    setTimeout(options: ISimpleTimerOptions, timeout?: number): this;
    /**
     * Sets timer interval and timeout options.
     *
     * @param interval the timer options to be set.
     * @param timeout the timeout used to abort timer.
     */
    setTimeout(interval: ISimpleTimerOptions, timeout?: number): this;
    /**
     * Sets the pinger options.
     *
     * @param options the pinger options to be set.
     */
    setConnect(options: IPingerOptions): this;
    /**
     * Sets host, port and attempt options for pinger.
     *
     * @param host the host to be pinged.
     * @param port the host's port.
     * @param attempts the number of atempts.
     */
    setConnect(host: string, port?: number, attempts?: number): this;
    /**
     * Sets a known command to be pinged.
     *
     * @param command a known command to be pinged.
     */
    onConnect(command: string): this;
    /**
     * Sets a known command to be pinged.
     *
     * @param command a known command to be pinged.
     */
    onConnect(command: Command): this;
    /**
     * Sets a custom handler to be called on ping connected.
     *
     * @param command a known command to be pinged.
     */
    onConnect(handler: PingerHandler): this;
    /**
     * Calls known command when timer is idle.
     *
     * @param command a known command to be called on timer idle.
     */
    onTimeout(command: string): this;
    /**
     * Calls known command when timer is idle.
     *
     * @param command a known command to be called on timer idle.
     */
    onTimeout(command: Command): this;
    /**
     * Calls the defined handler when timer is idle.
     *
     * @param handler a timer handler to be called.
     */
    onTimeout(handler: SimpleTimerHandler): this;
    /**
     * Adds a new sub command.
     *
     * @param options the command configuration options.
     */
    child(options: ICommandOptions): Command;
    /**
     * Adds the command as a sub command.
     *
     * @param command a command instance.
     * @param as an alias name for the command.
     */
    child(command: Command, as?: string): Command;
    /**
     * Adds a new sub command.
     *
     * @param command the sub command to be executed.
     * @param args the arguments to be pased.
     * @param as an alias name for the command.
     */
    child(command: string, args?: string | string[], as?: string): Command;
    /**
     * Adds a new sub command.
     *
     * @param command the sub command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     * @param as an alias name for the command.
     */
    child(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;
    /**
     * Runs the command.
     *
     * @param transform optional tranform, handy when calling programatically.
     */
    run(transform?: TransformHandler): void | this;
    /**
     * Kills the command if process still exists.
     */
    kill(signal?: NodeJS.Signals): void;
}
