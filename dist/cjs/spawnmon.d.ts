import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color } from './types';
export declare const DEFAULT_GROUP_NAME = "default";
export declare class Spawnmon {
    private prevChar;
    private indexes;
    maxPrefix: number;
    commands: Map<string, Command>;
    groups: {
        [key: string]: Command[];
    };
    inputCommand: Command;
    options: ISpawnmonOptions;
    constructor(options?: ISpawnmonOptions);
    /**
     * Ensures data is as string and that we don't have unnecessary line returns.
     *
     * @param data the data to be output.
     */
    protected prepareOutput(data: any): string;
    /**
     * Gets the index of a command.
     *
     * @param command the command name, alias or instance to get an index for.
     * @param group the group to get the index of if none assumes the default.
     */
    protected getIndex(command: string | Command): [number, number];
    /**
     * Pads the prefix for display in console.
     *
     * @param prefix the prefix to be padded.
     * @param offset the offset in spaces.
     * @param align the alignment for the padding.
     */
    protected padPrefix(prefix: string, offset: number, align?: 'left' | 'right' | 'center'): string;
    /**
     * Gets the prefix key from known keys in the prefix template.
     */
    protected getPrefixKey(): string;
    /**
     * Sets the maximum allowable prefix VALUE length based on prefix key type.
     * This is NOT based on the length of the entire prefix but rather the
     * defined value e.g. index, command name, pid or timestamp.
     *
     * @param commands list of command names or Command instances.
     */
    protected setMaxPrefix(commands: (string | Command)[]): number;
    /**
     * Gets and formats the prefix for logging to output stream.
     *
     * @param command the command to get and format prefix for.
     * @param color the color of the prefix if any.
     */
    protected getPrefix(command: string | Command, color?: Color): string;
    /**
     * Formats string for log output.
     *
     * @param output the data to be formatted.
     * @param prefix optional prefix for each line.
     * @param condensed indicates output should be condensed removing spaces.
     */
    protected formatLines(output: string, command?: string | Command): string;
    /**
     * Gets process id's of commands.
     */
    get pids(): number[];
    /**
     * Outputs data to specified write stream.
     *
     * @param data the data or error to throw to write out to the write stream.
     * @param command the command instance or name requesting output.
     */
    log(data: string | Error, command?: string | Command): Promise<void>;
    /**
     * A lookup and normalizer to find command.
     * For most actions involving finding a command
     * this method should be called as it simplifies the find.
     *
     * @param command the command name, alias or an instance of Command.
     * @param strict when false will get based on alias or command name.
     */
    get(command: string | Command, strict?: boolean): Command;
    /**
     * Checks if a the Spawnmon instance knows of the command.
     *
     * @param command the command name or Command instance.
     */
    has(command: string | Command): boolean;
    /**
     * Ensures that a command exists in the Spawnmon command instance.
     *
     * @param command the command to ensure.
     */
    ensure(command: string | Command, as?: string): this;
    /**
     * Gets commands for a group.
     *
     * @param groups the groups to get commands for.
     */
    getGroup(...groups: string[]): Command[];
    /**
     * Checks if commands have a specific group.
     *
     * @param group the group to inpect if exists.
     */
    hasGroup(group: string): boolean;
    /**
     * Gets the groups the command belongs to..
     *
     * @param command a command to get the group for.
     */
    getCommandGroups(command: Command): string[];
    /**
   * Gets the first group the command belongs to..
   *
   * @param command a command to get the group for.
   * @param first when true gets only the first group.
   */
    getCommandGroups(command: Command, first: true): string;
    /**
     * Inits a new command by options object without adding to group or instance.
     *
     * @param options the command configuration obtions.
     */
    add(options: ICommandOptions): Command;
    /**
     * Inits existing Command without adding to group or instance.
     * This method a bit circular used as normalizer may set defaults
     * or other options in the future.
     *
     * @param command a command instance.
     * @param as an optional alias for the command.
     */
    add(command: Command, as?: string): Command;
    /**
      * Inits a new command by args without adding to group or commands.
      *
      * @param command the command to be executed.
      * @param args the arguments to be pased.
      * @param as an alias name for the command.
      */
    add(command: string, args?: string | string[], as?: string): Command;
    /**
     * Inits a new command by args without adding to group or commands.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     * @param as an alias name for the command.
     */
    add(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;
    /**
     * Removes a command from the instance. Not likely to be
     * used but for good measure it's here, also removes from
     * any assigned groups.
     *
     * @param command the command to be removed.
     */
    remove(command: string | Command): boolean;
    /**
      * Runs commands by name.
      *
      * @param commands the name of the commands to run in group.
      */
    run(...commands: string[]): void;
    /**
      * Runs commands by instance.
      *
      * @param commands the Command instances to run.
      */
    run(...commands: Command[]): void;
    /**
     * Runs by group name(s).
     *
     * @param groups additional groups to be run.
     */
    runGroup(...groups: string[]): void;
    /**
    * Kills running commands.
    */
    kill(): any;
    /**
     * Kills specified commands.
     */
    kill(...commands: string[]): any;
    /**
     * Kills specified commands.
     */
    kill(...commands: Command[]): any;
    handleInput(command: string | Command): this;
    /**
     * Handles node signals, useful for cleanup.
     */
    handleSignals(): void;
}
