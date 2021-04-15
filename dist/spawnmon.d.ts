import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color } from './types';
export declare const DEFAULT_GROUP_NAME = "default";
export declare class Spawnmon {
    private prevChar;
    running: Command[];
    maxPrefix: number;
    commands: Map<string, Command>;
    groups: Map<string, string[]>;
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
    protected getIndex(command: string | Command, group?: string): [number, number];
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
    protected getPrefix(command: string | Command, color?: Color, group?: string): string;
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
    * Assigns command(s) to a group.
    *
    * @param group the name of the group to set or update.
    * @param command the command name to set or merge witht the group.
    * @param merge when true commands are merged with current.
    */
    assign(group: string, commands: string, merge?: boolean): this;
    /**
    * Assigns command(s) to a group.
    *
    * @param group the name of the group to set or update.
    * @param command the command to set or merge witht the group.
    * @param merge when true commands are merged with current.
    */
    assign(group: string, commands: Command, merge?: boolean): this;
    /**
     * Assigns command(s) to a group.
     *
     * @param group the name of the group to set or update.
     * @param commands the command names to set or merge witht the group.
     * @param merge when true commands are merged with current.
     */
    assign(group: string, commands: string[], merge?: boolean): this;
    /**
     * Assigns command(s) to a group.
     *
     * @param group the name of the group to set or update.
     * @param commands the commands to set or merge witht the group.
     * @param merge when true commands are merged with current.
     */
    assign(group: string, commands: Command[], merge?: boolean): this;
    /**
     * Removes command from default group.
     *
     * @param commands the commands to be filtered/removed.
     */
    unassign(command: string): this;
    /**
     * Removes command from default group.
     *
     * @param command the commands to be filtered/removed.
     */
    unassign(commands: Command): this;
    /**
     * Removes command names from default group.
     *
     * @param commands the commands to be filtered/removed.
     */
    unassign(commands: string[]): this;
    /**
     * Removes commands from default group.
     *
     * @param commands the commands to be filtered/removed.
     */
    unassign(commands: Command[]): this;
    /**
     * Removes command from group by group name.
     *
     * @param group the group name to be filtered.
     * @param commands the command to be filtered/removed.
     */
    unassign(group: string, commands: string): this;
    /**
    * Removes command from group by group name.
    *
    * @param group the group name to be filtered.
    * @param commands the command to be filtered/removed.
    */
    unassign(group: string, commands: Command): this;
    /**
     * Removes commands from group by group name.
     *
     * @param group the group name to be filtered.
     * @param commands the commands to be filtered/removed.
     */
    unassign(group: string, commands: string[]): this;
    /**
     * Removes commands from group by group name.
     *
     * @param group the group name to be filtered.
     * @param commands the commands to be filtered/removed.
     */
    unassign(group: string, commands: Command[]): this;
    /**
     * Inits a new command by options object without adding to group or instance.
     *
     * @param options the command configuration obtions.
     */
    init(options: ICommandOptions): Command;
    /**
     * Inits existing Command without adding to group or instance.
     * This method a bit circular used as normalizer may set defaults
     * or other options in the future.
     *
     * @param command a command instance.
     * @param as an optional alias for the command.
     */
    init(command: Command, as?: string): Command;
    /**
      * Inits a new command by args without adding to group or commands.
      *
      * @param command the command to be executed.
      * @param args the arguments to be pased.
      * @param as an alias name for the command.
      */
    init(command: string, args?: string | string[], as?: string): Command;
    /**
     * Inits a new command by args without adding to group or commands.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param options additional command options.
     * @param as an alias name for the command.
     */
    init(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;
    /**
     * Creates a new command by options object without adding to group.
     *
     * @param options the command configuration obtions.
     */
    create(options: ICommandOptions): Command;
    /**
     * Creates a command by instance without adding to group.
     *
     * @param command a command instance.
     * @param as an optional alias for the command.
     */
    create(command: Command, as?: string): Command;
    /**
     * Creats a new command by args without adding to group.
     *
     * @param command the command to be executed.
     * @param args the arguments to be pased.
     * @param as an alias name for the command.
     */
    create(command: string, args?: string | string[], as?: string): Command;
    /**
      * Creats a new command by args without adding to group.
      *
      * @param command the command to be executed.
      * @param args the arguments to be pased.
      * @param options additional command options.
      * @param as an alias name for the command.
      */
    create(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;
    /**
     * Creates a new command and adds to the default group.
     *
     * @param options the command configuration obtions.
     */
    add(options: ICommandOptions): Command;
    /**
     * Adds existing Command to Spawnmon instance and adds to the default group.
     *
     * @param command a command instance.
     * @param as an optional alias for the command.
     */
    add(command: Command, as?: string): Command;
    /**
    * Creates a new command to the instance and adds to the default group.
    *
    * @param command the command to be executed.
    * @param args the arguments to be pased.
    * @param as an alias name for the command.
    */
    add(command: string, args?: string | string[], as?: string): Command;
    /**
     * Creates a new command adds to instance and default group.
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
     * Runs all commands in default group.
     */
    run(): void;
    /**
      * Runs a command by name.
      *
      * @param command the name of the command to run
      */
    run(command: string): void;
    /**
     * Runs a command by instance.
     *
     * @param command the command instance to run
     */
    run(command: Command): void;
    /**
     * Runs commands by name.
     *
     * @param commands the names of the commands to be run.
     */
    run(...commands: string[]): void;
    /**
     * Runs a commands by instance.
     *
     * @param command the command instances to run
     */
    run(...command: Command[]): void;
    /**
    * Runs commands by instance.
    *
    * @param group the group name to run.
    * @param commands the name of the commands to run in group.
    */
    run(group: string, ...commands: string[]): void;
    runGroup(group: string, ...groups: string[]): void;
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
    /**
     * Handles node signals, useful for cleanup.
     */
    handleSignals(): void;
}
