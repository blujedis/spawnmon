/// <reference types="node" />
import { Subscription } from 'rxjs';
import { ChildProcess } from 'child_process';
import { Spawnmon } from './spawnmon';
import { ICommandOptions, IMonitorOptions, TransformHandler } from './types';
import { Pinger } from './pinger';
export declare class Command {
    private delayTimeoutId;
    private timer;
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
    private spawnCommnad;
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
    pingAfter(pinger: Pinger, condition: () => boolean): void;
    /**
     * Calls a callback when condition is met and output is idle.
     *
     * @param interval the time interval to ping at.
     * @param cb a callback to be called when condition is met.
     */
    onIdle(interval: number, cb: () => void): this;
    /**
    * Calls a callback when condition is met and output is idle.
    *
    * @param cb a callback to be called when condition is met.
    */
    onIdle(cb: () => void): this;
    /**
    * Calls a callback when condition is met and output is idle.
    *
    * @param options the time timer configuration object.
    */
    onIdle(options: IMonitorOptions): this;
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
