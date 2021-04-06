/// <reference types="node" />
import { Subscription } from 'rxjs';
import { ChildProcess } from 'child_process';
import { Spawnmon } from './spawnmon';
import { ICommandOptions, TransformHandler } from './types';
export declare class Command {
    child: ChildProcess;
    subscriptions: Subscription[];
    options: ICommandOptions;
    spawnmon: Spawnmon;
    constructor(options: ICommandOptions, spawnmon?: Spawnmon);
    /**
     * Prepares options and command arguments.
     * Ensures we're always getting the lastest.
     */
    private get prepare();
    /**
     * Subscribes to a child's stream.
     *
     * @param from the stream the subscription is from.
     * @param stream the readable stream to get event from.
     * @param transform the transform for output.
     */
    private subscribe;
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
    get args(): any[];
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
     * Runs the command.
     *
     * @param transform optional tranform, handy when calling programatically.
     */
    run(transform?: TransformHandler): this;
    /**
     * Kills the command if process still exists.
     */
    kill(): void;
}
