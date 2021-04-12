import supportsColor from 'supports-color';
import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color, PrefixKey } from './types';
import { colorize, truncate, isBlankLine, createError, simpleTimestamp } from './utils';

const colorSupport = supportsColor.stdout;

// prefix key names.

const SPAWNMON_DEFAULTS: ISpawnmonOptions = {
  cwd: process.cwd(),
  writestream: process.stdout,
  transform: (line) => line.toString(),
  prefix: '[{index}]', // index, command, pid, timestamp
  prefixMax: 10,
  defaultColor: 'dim',
  prefixAlign: 'left',
  prefixFill: '.',
  condensed: false,
  handleSignals: true,
  onTimestamp: simpleTimestamp
};

export const DEFAULT_GROUP_NAME = 'default';

export class Spawnmon {

  private prevChar;

  running: Command[]; // the running commands.
  indexes: string[] = [];
  maxPrefix = 0; // updated before run.
  commands = new Map<string, Command>();
  groups = new Map<string, string[]>();

  options: ISpawnmonOptions;

  constructor(options?: ISpawnmonOptions) {

    options = {
      ...SPAWNMON_DEFAULTS,
      ...options
    };

    if (colorSupport)
      options.env = {
        ...options.env,
        FORCE_COLOR: colorSupport.level + ''
      };

    if (options.handleSignals)
      this.handleSignals();
    this.groups.set(DEFAULT_GROUP_NAME, []);

    this.options = options;

  }

  /**
   * Ensures data is as string and that we don't have unnecessary line returns.
   * 
   * @param data the data to be output.
   */
  protected prepareOutput(data: any): string {
    data = data.toString();
    if (!/\n$/.test(data))
      data += '\n';
    if (/\n\n$/.test(data))
      data = data.replace(/\n\n$/, '\n');
    return data;
  }

  /**
   * Gets the index of a command.
   * 
   * @param command the command name, alias or instance to get an index for.
   * @param group the group to get the index of if none assumes the default.
   */
  protected getIndex(command: string | Command, group = DEFAULT_GROUP_NAME) {

    if (command instanceof Command)
      command = command.name;

    const indexes = this.groups.get(group);

    if (!indexes)
      throw createError(`Group ${group} could NOT be found.`);

    return [indexes.indexOf(command), indexes.length] as [number, number];

  }

  /**
   * Pads the prefix for display in console.
   * 
   * @param prefix the prefix to be padded.
   * @param offset the offset in spaces.
   * @param align the alignment for the padding.
   */
  protected padPrefix(prefix: string, offset: number, align: 'left' | 'right' | 'center' = this.options.prefixAlign) {
    if (offset <= 0)
      return prefix; // nothing to do.
    const fill = this.options.prefixFill;
    if (align === 'right')
      prefix = fill.repeat(offset) + prefix;
    else if (align === 'center')
      prefix = fill.repeat(Math.floor(offset / 2)) + prefix + fill.repeat(Math.floor(offset / 2) + offset % 2);
    else
      prefix = prefix + fill.repeat(offset);
    return prefix;
  }

  /**
   * Gets the prefix key from known keys in the prefix template.
   */
  protected getPrefixKey(): string {
    if (!this.options.prefix)
      return '';
    return this.options.prefix.match(/index|command|pid|timestamp/g)[0] || '';
  }

  /**
   * Sets the maximum allowable prefix VALUE length based on prefix key type.
   * This is NOT based on the length of the entire prefix but rather the
   * defined value e.g. index, command name, pid or timestamp.
   * 
   * @param commands list of command names or Command instances.
   */
  protected setMaxPrefix(commands: (string | Command)[]) {

    // Nothing to do, max prefix is only needed for command labels.
    if (this.getPrefixKey() !== 'command') {
      this.maxPrefix = 0;
      return this.maxPrefix;
    }

    // Iterate and get command name longest length.
    const max = Math.max(0, ...commands.map(cmd => this.get(cmd).name).map(v => v.length));

    // If calculated max is greater then allowable set to allowable defined in options.
    // otherwise set to the max calculated.
    this.maxPrefix = this.options.prefixMax > max ? this.options.prefixMax : max;

    return this.maxPrefix;

  }

  /**
   * Gets and formats the prefix for logging to output stream.
   * 
   * @param command the command to get and format prefix for.
   * @param color the color of the prefix if any.
   */
  protected getPrefix(command: string | Command, color: Color = this.options.defaultColor, group = DEFAULT_GROUP_NAME) {

    let prefix = '';
    const cmd = this.get(command);

    if (cmd.prefixCache)
      return cmd.prefixCache;

    const prefixKey = this.getPrefixKey();

    // Nothing to do, blank prefix?
    if (!prefixKey)
      return '';

    const template = this.options.prefix;
    const [index, indexesLen] = this.getIndex(cmd, group);
    color = cmd.options.color || color;

    const map = {
      index,
      pid: cmd.pid,
      command: cmd.name,
      timestamp: this.options.onTimestamp()
    };

    if (prefixKey !== 'command') {
      prefix = template.replace(`{${prefixKey}}`, map[prefixKey]) || '';
    }
    else {

      const templateChars = template.replace(prefixKey, '');
      const innerLength = Math.max(0, this.maxPrefix - templateChars.length);

      // only one command just use it's full length unless too long.
      if (indexesLen === 1 && map.command.length <= innerLength) {
        prefix = map.command;
      }
      else {
        prefix = truncate(map.command, innerLength, '');
        const offset = innerLength - prefix.length;
        prefix = this.padPrefix(prefix, offset, this.options.prefixAlign);
      }

      prefix = template.replace(`{${prefixKey}}`, prefix);

    }

    if (color)
      prefix = colorize(prefix, ...color.split('.'));

    // no need to calculate this again unless timestamp.
    if (prefixKey !== 'timestamp')
      cmd.prefixCache = prefix;

    return prefix;

  }

  /**
   * Formats string for log output.
   * 
   * @param output the data to be formatted.
   * @param prefix optional prefix for each line.
   * @param condensed indicates output should be condensed removing spaces.
   */
  protected formatLines(output: string, command?: string | Command) {

    // Don't format output.
    if (this.options.raw)
      return output;

    const cmd = command && this.get(command);
    let prefix = (cmd && this.getPrefix(cmd, cmd.options.color)) || '';
    const condensed = cmd && cmd.options.condensed;

    // grabbed from concurrently well played fellas!!!
    // what's funny is when I looked at their source
    // had the immediate ahhh haaa moment :)
    // see https://github.com/kimmobrunfeldt/concurrently/blob/e36e8c18c20a72e4745e481498f21ca00e29a0e7/src/logger.js#L96
    output = output.replace(/\u2026/g, '...');

    if ((prefix as string).length)
      prefix = prefix + ' ';

    let lines = output.split('\n');

    lines = lines.reduce((results, line, index) => {

      // Empty line condensed on ignore it.
      if (condensed && (isBlankLine(line) || !line.length))
        return results;

      // const inspect = line.replace(/[^\w]/gi, '').trim();

      if (index === 0 || index === lines.length - 1)
        return [...results, line];

      // Ansi escape resets color that may wrap from preceeding line.
      line = '\u001b[0m' + prefix + line;

      return [...results, line];

    }, []);

    output = lines.join('\n');

    const last = output[output.length - 1];

    if (!this.prevChar || this.prevChar === '\n')
      output = prefix + output;

    this.prevChar = last;

    // need to tweak this a bit so we don't get random prefix with blank line.
    return output;

  }

  /**
   * Gets process id's of commands.
   */
  get pids() {
    return [...this.commands.values()].map(cmd => cmd.pid);
  }

  /**
  * Outputs data to specified write stream.
  * 
  * @param data the data or error to throw to write out to the write stream.
  * @param shouldKill when true should exist after writing.
  */
  async log(data: string | Error, shouldKill?: boolean): Promise<void>;

  /**
   * Outputs data to specified write stream.
   * 
   * @param data the data or error to throw to write out to the write stream.
   * @param command the command instance or name requesting output.
   * @param shouldKill when true should exist after writing.
   */
  async log(data: string | Error, command: string | Command, shouldKill?: boolean): Promise<void>;

  async log(data: string | Error, command?: string | Command | boolean, shouldKill = false) {

    if (data instanceof Error)
      throw data;

    if (typeof command === 'boolean') {
      shouldKill = command;
      command = undefined;
    }

    data = this.formatLines(data, command as string | Command);

    await this.options.writestream.write(this.prepareOutput(data));

    if (shouldKill)
      this.kill();

  }

  /**
   * A lookup and normalizer to find command.
   * For most actions involving finding a command
   * this method should be called as it simplifies the find.
   * 
   * @param command the command name, alias or an instance of Command.
   * @param strict when false will get based on alias or command name.
   */
  get(command: string | Command, strict = false): Command {
    if (command instanceof Command)
      return command;
    const cmds = [...this.commands.values()];
    const predicate = (cmd: Command) => {
      if (!strict)
        return cmd.name === command || cmd.command === command;
      return cmd.name === command;
    };
    return cmds.find(predicate);
  }

  /**
   * Checks if a the Spawnmon instance knows of the command.
   * 
   * @param command the command name or Command instance.
   */
  has(command: string | Command) {
    const cmd = this.get(command, false); // strict checks only as in command map
    return this.commands.has((cmd && cmd.name) || undefined);
  }

  /**
   * Ensures that a command exists in the Spawnmon command instance.
   * 
   * @param command the command to ensure.
   */
  ensure(command: string | Command, as?: string) {
    const cmd = this.get(command);
    if (!cmd)
      throw createError(`Failed to validate ${command || 'unknown'} command.`);
    cmd.options.as = as || cmd.name;
    if (!this.has(cmd))
      this.commands.set(cmd.name, cmd);
    return this;
  }

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

  assign(group: string, commands: string | Command | (string | Command)[], merge = false) {

    if (typeof commands === 'string' || commands instanceof Command)
      commands = [commands];

    commands = commands.map(cmd => this.get(cmd).name);

    if (merge)
      commands = [...(this.groups.get(group) || []), ...commands];

    this.groups.set(group, [...commands as string[]]);

    return this;

  }

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

  unassign(
    groupOrCommand: string | Command | (string | Command)[],
    commands?: string | Command | (string | Command)[]) {

    let groupName = DEFAULT_GROUP_NAME;

    // First arg is a group name.
    if (typeof groupOrCommand === 'string' && this.groups.get(groupOrCommand)) {
      groupName = groupOrCommand;
    }
    else {
      commands = groupOrCommand;
      groupOrCommand = undefined;
    }

    // ensure the command is of type Array.
    if (typeof commands !== 'undefined' && !Array.isArray(commands))
      commands = [commands];

    let grp = this.groups.get(groupName || DEFAULT_GROUP_NAME);

    // At this point we need to have a group
    if (!grp)
      throw createError(`Assign failed, group name ${groupOrCommand} is unknown.`);




    // Ensure commands are string.
    let cmds = commands.map(cmd => this.get(cmd).name);

    cmds = grp.filter(k => !cmds.includes(k));

    this.assign(groupOrCommand as string, cmds);

    return this;

  }

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

  init(
    nameCmdOrOpts: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptsOrAs?: Omit<ICommandOptions, 'command' | 'args'> | string,
    as?: string) {

    if (nameCmdOrOpts instanceof Command) {
      const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameCmdOrOpts.command;
      nameCmdOrOpts.options.as = aliasOrName;
      return nameCmdOrOpts;
    }

    if (typeof initOptsOrAs === 'string') {
      as = initOptsOrAs;
      initOptsOrAs = undefined;
    }

    if (typeof nameCmdOrOpts === 'object' && !Array.isArray(nameCmdOrOpts) && nameCmdOrOpts !== null) {
      initOptsOrAs = nameCmdOrOpts;
      commandArgs = undefined;
      nameCmdOrOpts = undefined;
    }


    let options = nameCmdOrOpts as ICommandOptions;

    // ensure an array.
    if (typeof commandArgs === 'string')
      commandArgs = [commandArgs];

    options = {
      command: nameCmdOrOpts as string,
      args: commandArgs as string[],
      ...initOptsOrAs as ICommandOptions
    };

    const cmd = new Command({ as, ...options }, this);
    const aliasOrName = as || cmd.command;
    cmd.options.as = aliasOrName;

    return cmd;

  }

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

  create(
    nameCmdOrOpts: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptsOrAs?: Omit<ICommandOptions, 'command' | 'args'> | string,
    as?: string) {

    const cmd = this.init(nameCmdOrOpts as any, commandArgs, initOptsOrAs as any, as);

    this.ensure(cmd);

    return cmd;

  }

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

  add(
    nameCmdOrOpts: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptsOrAs?: Omit<ICommandOptions, 'command' | 'args'> | string,
    as?: string) {

    const cmd = this.create(nameCmdOrOpts as any, commandArgs, initOptsOrAs as any, as);

    // Add to default create.
    cmd.assign(DEFAULT_GROUP_NAME);

    return cmd;

  }

  /**
   * Removes a command from the instance. Not likely to be
   * used but for good measure it's here, also removes from 
   * any assigned groups.
   * 
   * @param command the command to be removed.
   */
  remove(command: string | Command) {
    const cmd = this.get(command);
    if (!this.has(cmd))
      return false;
    [...this.groups.keys()].forEach(k => {
      const group = this.groups.get(k);
      this.groups.set(k, group.filter(n => n !== cmd.name));
    });
    return this.commands.delete(cmd.name);
  }

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

  run(group?: string | Command, ...commands: (string | Command)[]) {

    // If first arg is not a group assume command.
    if (group instanceof Command || !this.groups.has(group)) {
      commands.unshift(group);
      group = undefined;
    }

    group = group || DEFAULT_GROUP_NAME;

    // If a group is provided use the group's commands.
    commands = (group && this.groups.has(group as string) ? this.groups.get(group as string) : commands) as string[];

    const cmds = commands.map(cmd => this.get(cmd));

    this.setMaxPrefix(cmds);

    // Run each command.
    cmds.forEach(cmd => cmd.run());

    this.running = cmds;

  }

  /**
  * Kills running commands.
  */
  kill()

  /**
   * Kills specified commands.
   */
  kill(...commands: string[])

  /**
   * Kills specified commands.
   */
  kill(...commands: Command[])

  kill(...commands: (string | Command)[]) {
    const cmds = commands.length ? commands.map(c => this.get(c)) : [...this.running];
    cmds.forEach(cmd => cmd.kill());
  }

  /**
   * Handles node signals, useful for cleanup.
   */
  handleSignals() {
    const signals = ['SIGINT', 'SIGHUP', 'SIGTERM'] as NodeJS.Signals[];
    signals.forEach(signal => {
      process.on(signal, () => {
        const lines = [];
        [...this.commands.values()].forEach(cmd => {
          lines.push(colorize(`${cmd.name} recived signal ${signal}.`, 'dim'));
          cmd.unsubscribe();
        });
        // could write to stdin or line by line but
        // these ends up a bit cleaner in term IMO.
        const output = ('\n' + lines.join('\n'));
        this.log(output, true);
      });
    });
  }

}