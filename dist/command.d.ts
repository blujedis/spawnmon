/// <reference types="node" />
import { Subscription } from 'rxjs';
import { ChildProcess } from 'child_process';
import { Writable } from 'stream';
import { Spawnmon } from './spawnmon';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
import { ICommandOptions, TransformHandler } from './types';
export declare class Command {
    private delayTimeoutId;
    spawnmon: Spawnmon;
    child: Spawnmon;
    parent: Command;
    process: ChildProcess;
    timer: SimpleTimer;
    pinger: Pinger;
    subscriptions: Subscription[];
    stdin: Writable;
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
     * Log response from subscriptions.
     *
     * @param data the data to be logged from the response.
     * @param shouldKill variable indicating Spawnmon should kill children.
     * @param shouldUpdate when true should update the timer which watches for idle commands
     */
    log(data: string | Error, shouldKill?: boolean, shouldUpdate?: boolean): void;
    /**
     * Gets the line prefix if enabled.
     */
    getPrefix(unpadded?: boolean): string;
    /**
     * Sets the options object.
     *
     * @param options options object to update or set to.
     * @param merge when true options are merged with existing.
     */
    setOptions(options: ICommandOptions, merge?: boolean): this;
    mute(): this;
    unmute(): this;
    /**
     * Unsubscribes from all subscriptions.
     */
    unsubscribe(): this;
    /**
    * Runs the specified command when idle.
    *
    * @param command a command instance.
    */
    onIdle(command: Command): Command;
    /**
     * Runs a command when idle after creating using options.
     *
     * @param options the command configuration obtions.
     */
    onIdle(options: ICommandOptions): Command;
    /**
     * Runs the new command when idle.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param as an alias name for the command.
     */
    onIdle(command: string, args?: string | string[], as?: string): Command;
    /**
     * Runs the new command when idle.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     * @param as an alias name for the command.
     */
    onIdle(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;
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
