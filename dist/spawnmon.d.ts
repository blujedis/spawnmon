import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color } from './types';
export declare class Spawnmon {
    private prevChar;
    commands: Map<string, Command>;
    running: boolean;
    indexes: string[];
    maxPrefix: number;
    options: ISpawnmonOptions;
    constructor(options?: ISpawnmonOptions);
    /**
     * Sets the maximum allowable prefix length based on command names.
     *
     * @param commands list of command names.
     */
    private setMaxPrefix;
    /**
     * Ensures data is as string and that we don't have unnecessary line returns.
     *
     * @param data the data to be output.
     */
    private prepareOutput;
    /**
     * Pads the prefix for display in console.
     *
     * @param prefix the prefix to be padded.
     * @param offset the offset in spaces.
     * @param align the alignment for the padding.
     */
    private padPrefix;
    /**
     * Formats string for log output.
     *
     * @param output the data to be formatted.
     * @param prefix optional prefix for each line.
     * @param condensed indicates output should be condensed removing spaces.
     */
    private formatLines;
    /**
     * Outputs data to specified write stream.
     *
     * @param data the data or error to throw to write out to the write stream.
     * @param shouldKill when true should exist after writing.
     */
    log(data: string | Error, shouldKill?: boolean): Promise<void>;
    /**
     * Outputs data to specified write stream.
     *
     * @param data the data or error to throw to write out to the write stream.
     * @param command the command instance or name requesting output.
     * @param shouldKill when true should exist after writing.
     */
    log(data: string | Error, command: string | Command, shouldKill?: boolean): Promise<void>;
    /**
     * Gets process id's of commands.
     */
    get pids(): number[];
    /**
     * Essentially a lookup and normalizer in one to find your command.
     *
     * @param command the command name, alias or an instance of Command.
     */
    getCommand(command: string | Command): Command;
    /**
     * Gets the index of a command.
     *
     * @param command the command name, alias or instance to get an index for.
     */
    getIndex(command: string | Command): number;
    /**
     * Formats the prefix for logging to output stream.
     *
     * @param command the command to get and format prefix for.
     * @param color the color of the prefix if any.
     */
    formatPrefix(command: string | Command, color?: Color): string;
    /**
     * Adds a new command to the queue by options object.
     *
     * @param options the command configuration obtions.
     */
    add(options: ICommandOptions): Command;
    /**
   * Adds existing Command to Spawnmon instance..
   *
   * @param command a command instance.
   * @param as an optional alias for the command.
   */
    add(command: Command, as?: string): Command;
    /**
  * Adds a new command to the queue.
  *
  * @param command the command to be executed.
  * @param args the arguments to be pased.
  * @param as an alias name for the command.
  */
    add(command: string, args?: string | string[], as?: string): Command;
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
     * Runs all bound commands.
     */
    run(): void;
    /**
    * Runs a command by name.
    *
    * @param command the name of the command to kill
    */
    run(command: string): void;
    /**
     * Runs commands by name.
     *
     * @param commands the names of the commands to be killed.
     */
    run(...commands: string[]): void;
    /**
     * Kills all bound commands.
     */
    kill(): void;
    /**
     * Kills a command by name.
     *
     * @param command the name of the command to kill
     */
    kill(command: string): void;
    /**
     * Kills commands by name.
     *
     * @param commands the names of the commands to be killed.
     */
    kill(...commands: string[]): void;
    /**
     * Handles node signals, useful for cleanup.
     */
    handleSignals(): void;
}
