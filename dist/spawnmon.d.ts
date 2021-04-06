/// <reference types="node" />
import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions } from './types';
export declare class Spawnmon {
    commands: Map<string, Command>;
    options: ISpawnmonOptions;
    constructor(options?: ISpawnmonOptions);
    get pids(): number[];
    /**
     * Writes output to the default or user specified stream.
     *
     * @param data the data to be written.
     */
    writer(data: string | Buffer): Promise<void>;
    /**
     * Adds a new command to the queue.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     */
    add(command: string, args?: any[], options?: Omit<ICommandOptions, 'command' | 'args'>): Command;
    /**
     * Adds a new command to the queue by options object.
     *
     * @param options the command configuration obtions.
     */
    add(options: ICommandOptions): Command;
    /**
     * Runs commands by name.
     *
     * @param commands the names of the commands to be killed.
     */
    run(...commands: string[]): void;
    /**
     * Runs a command by name.
     *
     * @param command the name of the command to kill
     */
    run(command: string): void;
    /**
     * Runs all bound commands.
     */
    run(): void;
    /**
     * Kills commands by name.
     *
     * @param commands the names of the commands to be killed.
     */
    kill(...commands: string[]): void;
    /**
     * Kills a command by name.
     *
     * @param command the name of the command to kill
     */
    kill(command: string): void;
    /**
     * Kills all bound commands.
     */
    kill(): void;
    /**
     * Helper to enabled catching uncaught and unhanded rejection errors.
     * Typically not needed but can be helpful when issues arise.
     */
    enableUncaughtExceptions(): () => void;
}
