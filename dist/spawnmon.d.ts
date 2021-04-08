import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color } from './types';
export declare class Spawnmon {
    commands: Map<string, Command>;
    running: boolean;
    indexes: string[];
    maxPrefix: number;
    options: ISpawnmonOptions;
    constructor(options?: ISpawnmonOptions);
    private setMaxPrefix;
    private prepareOutput;
    private padPrefix;
    /**
     * Outputs data to specified write stream.
     *
     * @param data the data to write out to the write stream.
     * @param shouldKill when true should exist after writing.
     */
    write(data: string | Error, shouldKill?: boolean): Promise<void>;
    /**
     * Gets process id's of commands.
     */
    get pids(): number[];
    formatPrefix(command: string, color?: Color): string;
    /**
     * Gets the index of a command.
     *
     * @param command the command name to get an index for.
     */
    getIndex(command: string): number;
    /**
     * Adds a new command to the queue.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     * @param as an alias name for the command.
     */
    add(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;
    /**
     * Adds existing Command to Spawnmon instance..
     *
     * @param command a command instance.
     * @param as an optional alias for the command.
     */
    add(command: Command, as?: string): Command;
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
    handleSignals(): void;
    /**
     * Helper to enabled catching uncaught and unhanded rejection errors.
     * Typically not needed but can be helpful when issues arise.
     */
    enableUncaughtExceptions(): () => void;
}
