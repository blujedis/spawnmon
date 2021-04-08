/// <reference types="node" />
import { Subscription } from 'rxjs';
import { ChildProcess } from 'child_process';
import { Spawnmon } from './spawnmon';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
import { ICommandOptions, IPingerOptions, ISimpleTimerOptions, PingerHandler, SimpleTimerHandler, TransformHandler } from './types';
export declare class Command {
    private delayTimeoutId;
    timer: SimpleTimer;
    pinger: Pinger;
    child: ChildProcess;
    subscriptions: Subscription[];
    options: ICommandOptions;
    spawnmon: Spawnmon;
    stdin: any;
    constructor(options: ICommandOptions, spawnmon?: Spawnmon);
    /**
     * Prepares options and command arguments.
     * Ensures we're always getting the lastest.
     * looks a mess here but simplifies options
     * object for the user.
     */
    private get prepare();
    private write;
    /**
     * Gets the line prefix if enabled.
     */
    private getPrefix;
    /**
     * Checks if out put should be condensed.
     *
     * @param data the data to inspect for condensed format.
     */
    private format;
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
     * Gets the process id if active.
     */
    get pid(): number;
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
     * Sets the options object.
     *
     * @param options options object to update or set to.
     * @param merge when true options are merged with existing.
     */
    setOptions(options: ICommandOptions, merge?: boolean): this;
    /**
     * Unsubscribes from all subscriptions.
     */
    unsubscribe(): this;
    /**
    * Creates Pinger instance using default options with provided
    * onConnected callback and timeout.
    *
    * @param timeout the timeout duration between tries.
    * @param onConnected a callback to be called when connected to socket.
    */
    setPinger(timeout: number, onConnected: PingerHandler): this;
    /**
    * Creates Pinger instance using default options with provided on connected callback.
    *
    * @param onConnected a callback to be called when connected to socket.
    */
    setPinger(onConnected: PingerHandler): this;
    /**
    * Creates Pinger instance using the provided options.
    *
    * @param options the time Pinger configuration object.
    */
    setPinger(options: IPingerOptions): this;
    /**
     * Creates Timer using interval and onCondition callback.
     *
     * @param interval the time interval to ping at.
     * @param onCondition a callback to be called when condition is met.
     */
    setTimer(interval: number, onCondition: SimpleTimerHandler): this;
    /**
    * Creates Timer using onCondition callback.
    *
    * @param onCondition a callback to be called when condition is met.
    */
    setTimer(onCondition: SimpleTimerHandler): this;
    /**
    * Creates Timer using the specified options for configuration.
    *
    * @param options the time timer configuration object.
    */
    setTimer(options: ISimpleTimerOptions): this;
    /**
   * Adds a new command to the queue.
   *
   * @param command the command to be executed.
   * @param as an alias name for the command.
   * @param args the arguments to be pased.
   * @param options additional command options.
   */
    runConnected(command: string, as: string, args: string | string[], options: Omit<ICommandOptions, 'command' | 'args'>): Command;
    /**
     * Adds a new command to the queue.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     */
    runConnected(command: string, args: string | string[], options: Omit<ICommandOptions, 'command' | 'args'>): Command;
    /**
     * Adds a new command to the queue.
     *
     * @param command the command to be executed.
     * @param options additional command options.
     */
    runConnected(command: string, options: Omit<ICommandOptions, 'command' | 'args'>): Command;
    /**
     * Adds existing Command to Spawnmon instance..
     *
     * @param command a command instance.
     * @param as an optional alias for the command.
     */
    runConnected(command: Command, as?: string): Command;
    /**
     * Runs the command.
     *
     * @param transform optional tranform, handy when calling programatically.
     */
    run(transform?: TransformHandler): void | this;
    /**
     * Kills the command if process still exists.
     */
    kill(signal?: NodeJS.Signals, cb?: (err?: Error) => void): void;
}
