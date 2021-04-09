import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color, } from './types';
import { colorize, truncate, isBlankLine, createError } from './utils';

// Sorce color.
process.env.FORCE_COLOR = '1';

const SPAWNMON_DEFAULTS: ISpawnmonOptions = {
  writestream: process.stdout,
  transform: (line) => line.toString(),
  prefix: 'index',
  prefixMax: 10,
  prefixDefaultColor: 'dim',
  prefixTemplate: '[{{prefix}}]',
  prefixAlign: 'left',
  prefixFill: '.',
  condensed: false,
  handleSignals: true
};

export const DEFAULT_GROUP_NAME = 'default';

export class Spawnmon {

  private prevChar;

  running = false;
  indexes: string[] = [];
  maxPrefix = 0; // updated before run.
  commands = new Map<string, Command>();
  groups = new Map<string, string[]>();

  options: ISpawnmonOptions;

  constructor(options?: ISpawnmonOptions) {
    this.options = { ...SPAWNMON_DEFAULTS, ...options };
    if (this.options.handleSignals)
      this.handleSignals();
    this.groups.set(DEFAULT_GROUP_NAME, []);
  }

  /**
   * Sets the maximum allowable prefix length based on command names.
   * 
   * @param commands list of command names.
   */
  private setMaxPrefix(commands: string[]) {
    const max = Math.max(0, ...commands.map(v => v.length));
    this.maxPrefix = max > this.options.prefixMax ? this.options.prefixMax : max;
  }

  /**
   * Ensures data is as string and that we don't have unnecessary line returns.
   * 
   * @param data the data to be output.
   */
  private prepareOutput(data: any): string {
    data = data.toString();
    if (!/\n$/.test(data))
      data += '\n';
    if (/\n\n$/.test(data))
      data = data.replace(/\n\n$/, '\n');
    return data;
  }

  /**
   * Pads the prefix for display in console.
   * 
   * @param prefix the prefix to be padded.
   * @param offset the offset in spaces.
   * @param align the alignment for the padding.
   */
  private padPrefix(prefix: string, offset: number, align: 'left' | 'right' | 'center' = this.options.prefixAlign) {
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
   * Formats string for log output.
   * 
   * @param output the data to be formatted.
   * @param prefix optional prefix for each line.
   * @param condensed indicates output should be condensed removing spaces.
   */
  private formatLines(output: string, command?: string | Command) {

    // Don't format output.
    if (this.options.unformatted)
      return output;

    const cmd = command && this.getCommand(command);
    let prefix = (cmd && this.formatPrefix(cmd.command, cmd.options.color)) || '';
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
   * Essentially a lookup and normalizer in one to find your command.
   * 
   * @param command the command name, alias or an instance of Command.
   */
  getCommand(command: string | Command): Command {
    if (command instanceof Command) // nothing to do.
      return command;
    return this.commands.get(command);
  }

  /**
   * Sets commands for a group.
   * 
   * @param name the name of the group to set or update.
   * @param commands the command names to set or merge witht the group.
   * @param merge when true commands are merged with current.
   */
  updateGroup(name: string, commands: string | string[], merge = false) {
    if (typeof commands === 'string')
      commands = [commands];
    if (merge)
      commands = [...(this.groups.get(name) || []), ...commands];
    this.groups.set(name, [...commands]);
  }

  /**
   * Removes command names from group.
   * 
   * @param name the group name to be filtered.
   * @param commands the commands to be filtered/removed.
   */
  filterGroup(name: string | string[], commands?: string[]) {
    if (Array.isArray(name)) {
      commands = name;
      name = undefined;
    }
    name = name || DEFAULT_GROUP_NAME;
    const group = this.groups.get(name as string) || [];
    commands = group.filter(v => !commands.includes(v));
    this.updateGroup(name as string, commands);
  }

  /**
   * Gets the index of a command.
   * 
   * @param command the command name, alias or instance to get an index for.
   * @param group the group to get the index of if none assumes the default.
   */
  getIndex(command: string | Command, group = DEFAULT_GROUP_NAME) {

    if (command instanceof Command)
      command = command.command;

    const indexes = this.groups.get(group);

    if (!indexes)
      throw createError(`Group ${group} could NOT be found.`);

    return indexes.indexOf(command);

  }

  /**
   * Formats the prefix for logging to output stream.
   * 
   * @param command the command to get and format prefix for.
   * @param color the color of the prefix if any.
   */
  formatPrefix(command: string | Command, color: Color = this.options.prefixDefaultColor) {

    let prefix = '';
    const cmd = this.getCommand(command);

    // prefix disabled or command is not auto runnable, return empty string.
    if (!this.options.prefix)
      return prefix;

    const template = this.options.prefixTemplate;
    const templateLen = template.replace('{{prefix}}', '').length;
    const adjMax = this.maxPrefix - templateLen;

    prefix = this.options.prefix === 'command' ? cmd.command : this.getIndex(cmd) + '';

    // Only truncate if command is used not index, no point.
    if (this.maxPrefix && adjMax > 0 && this.options.prefix === 'command') {
      prefix = prefix.length > adjMax && adjMax > 0
        ? truncate(prefix, adjMax, '')
        : prefix;
      const offset = prefix.length > adjMax ? 0 : adjMax - prefix.length;
      prefix = this.padPrefix(prefix, offset);
    }

    prefix = template.replace('{{prefix}}', prefix);

    if (color)
      prefix = colorize(prefix, color);

    return prefix;

  }

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

  add(
    nameOrOptions: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptions?: Omit<ICommandOptions, 'command' | 'args'> | string,
    as?: string) {

    if (nameOrOptions instanceof Command) {

      const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameOrOptions.command;

      this.commands.set(aliasOrName, nameOrOptions);

      // add to default group.
      nameOrOptions.group(DEFAULT_GROUP_NAME);

      return nameOrOptions;

    }

    if (typeof initOptions === 'string') {
      as = initOptions;
      initOptions = undefined;
    }

    if (typeof commandArgs === 'object' && !Array.isArray(commandArgs) && commandArgs !== null) {
      initOptions = commandArgs;
      commandArgs = undefined;
    }

    let options = nameOrOptions as ICommandOptions;

    // ensure an array.
    if (typeof commandArgs === 'string')
      commandArgs = [commandArgs];

    options = {
      command: nameOrOptions as string,
      args: commandArgs as string[],
      ...initOptions as ICommandOptions
    };

    const cmd = new Command(options, this);

    const aliasOrName = as || cmd.command;

    this.commands.set(aliasOrName as string, cmd);

    cmd.group(DEFAULT_GROUP_NAME);

    return cmd;

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
   * Runs commands by name.
   * 
   * @param commands the names of the commands to be run.
   */
  run(...commands: string[]): void;

  /**
    * Runs a command by name.
    * 
    * @param group the group name to run.
    * @param commands the name of the commands to run in group.
    */
  run(group: string, ...commands: string[]): void;

  run(group?: string, ...commands: string[]) {

    if (!this.groups.has(group))
      commands.unshift(group);

    const normalizedCommands = !commands.length ? this.groups.get(DEFAULT_GROUP_NAME) : commands;
    commands = this.groups.has(group) ? this.groups.get(group) : normalizedCommands;

    this.setMaxPrefix(commands);

    commands.forEach(key => {
      const command = this.commands.get(key);
      setTimeout(() => {
        command.run();
      }, 100);
    });

    this.running = true;

  }

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

  kill(...names: string[]) {
    if (!names.length)
      names = [...this.commands.keys()];
    this.running = false;
    names.forEach(k => {
      const command = this.commands.get(k);
      command.kill();
    });
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
          lines.push(colorize(`${cmd.command} recived signal ${signal}.`, 'dim'));
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