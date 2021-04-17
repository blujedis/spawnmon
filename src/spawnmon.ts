import { fromEvent, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import supportsColor from 'supports-color';
import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color, PrefixKey } from './types';
import { colorize, truncate, isBlankLine, createError, simpleTimestamp, ensureDefaults } from './utils';

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
  onTimestamp: simpleTimestamp,
  outputExitCode: false
};

export const DEFAULT_GROUP_NAME = 'default';

export class Spawnmon {

  private prevChar;
  private indexes = [] as Command[];

  maxPrefix = 0; // updated before run.
  commands = new Map<string, Command>();
  groups = {} as { [key: string]: Command[] }; // running groups.
  inputCommand: Command; // the command handling input.

  options: ISpawnmonOptions;

  constructor(options?: ISpawnmonOptions) {

    options = ensureDefaults(options, SPAWNMON_DEFAULTS);

    if (colorSupport)
      options.env = {
        ...options.env,
        FORCE_COLOR: colorSupport.level + ''
      };

    if (options.handleSignals)
      this.handleSignals();

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
  protected getIndex(command: string | Command) {

    if (!(command instanceof Command))
      command = this.get(command);

    return [this.indexes.indexOf(command), this.indexes.length] as [number, number];

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
    return this.options.prefix.match(/index|command|pid|timestamp|group/g)[0] || '';
  }

  /**
   * Sets the maximum allowable prefix VALUE length based on prefix key type.
   * This is NOT based on the length of the entire prefix but rather the
   * defined value e.g. index, command name, pid or timestamp.
   * 
   * @param commands list of command names or Command instances.
   */
  protected setMaxPrefix(commands: (string | Command)[]) {

    const prefixKey = this.getPrefixKey();

    // Nothing to do, max prefix is only needed
    // for command and group labels.
    if (!['command', 'group'].includes(prefixKey)) {
      this.maxPrefix = 0;
      return this.maxPrefix;
    }

    const labels = commands.map(cmd => {
      const c = this.get(cmd);
      if (prefixKey === 'command')
        return c.name;
      return this.getCommandGroups(c, true);
    });

    // Iterate and get command name longest length.
    const max = Math.max(0, ...labels.map(v => v.length));

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
  protected getPrefix(command: string | Command, color: Color = this.options.defaultColor) {

    let prefix = '';
    const cmd = this.get(command);

    // If cached no need to calc, all prefix types
    // can be cached with the exception of timestamp.
    if (cmd.prefixCache)
      return cmd.prefixCache;

    const prefixKey = this.getPrefixKey();

    // Nothing to do, blank prefix?
    if (!prefixKey)
      return '';

    const template = this.options.prefix;
    const [index, indexesLen] = this.getIndex(cmd);
    color = cmd.options.color || color;

    const map = {
      index: index === -1 ? '-' : index,
      pid: cmd.pid,
      command: cmd.name,
      timestamp: this.options.onTimestamp(),
      group: this.getCommandGroups(cmd, true)
    };

    // Just replace template if not group or command.
    if (!['command', 'group'].includes(prefixKey)) {
      prefix = template.replace(`{${prefixKey}}`, map[prefixKey]) || '';
    }

    // If group or command we need to calculate
    // and pad if needed.
    else {

      const templateChars = template.replace(prefixKey, '');
      const innerLength = Math.max(0, this.maxPrefix - templateChars.length);

      const label = prefixKey === 'command' ? map.command : map.group;

      // only one command just use it's full length unless too long.
      if (indexesLen === 1 && label.length <= innerLength) {
        prefix = label;
      }
      else {
        prefix = truncate(label, innerLength, '');
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

  async write(data: string) {
    return this.options.writestream.write(data);
  }

  /**
   * Outputs data to specified write stream.
   * 
   * @param data the data or error to throw to write out to the write stream.
   * @param command the command instance or name requesting output.
   */
  async log(data: string | Error, command?: string | Command,) {
    if (data instanceof Error)
      throw data;
    data = this.formatLines(data, command as string | Command);
    await this.write(this.prepareOutput(data));
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
   * Gets commands for a group.
   * 
   * @param groups the groups to get commands for.  
   */
  getGroup(...groups: string[]) {

    const found = [] as Command[];
    const cmds = [...this.commands.values()];

    cmds.forEach(cmd => {
      groups.forEach(g => {
        if (cmd.options.group.includes(g))
          found.push(cmd);
      });
    });

    return found;

  }

  /**
   * Checks if commands have a specific group.
   * 
   * @param group the group to inpect if exists.
   */
  hasGroup(group: string) {
    return !!this.getGroup(group).length;
  }

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
  getCommandGroups(command: Command, first = false) {
    const groups = [] as string[];
    for (const k in this.groups) {
      const group = this.groups[k];
      if (~group.indexOf(command))
        groups.push(k);
    }
    if (first)
      return groups[0];
    return groups;
  }

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

  add(
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
      as,
      ...initOptsOrAs as ICommandOptions
    };

    const cmd = new Command(options, this);

    // Ensure the command is added to the commands map/collection.
    this.ensure(cmd);

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
    return this.commands.delete(cmd.name);
  }

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

  run(...commands: (string | Command)[]) {

    // ONlY load runnable commands when not 
    // statically specified.
    if (!commands.length)
      commands = [...this.commands.values()].filter(cmd => cmd.options.runnable);

    const cmds = commands.map(cmd => {

      cmd = this.get(cmd);
      const groups = cmd.options.group as string[];

      if (groups && groups.length) {
        groups.forEach(g => {
          this.groups[g] = this.groups[g] || [];
          this.groups[g].push(cmd as Command);
        });
      }
      else {
        this.groups[DEFAULT_GROUP_NAME] = this.groups[DEFAULT_GROUP_NAME] || [];
        this.groups[DEFAULT_GROUP_NAME].push(cmd);
      }

      return cmd;

    });

    this.indexes = [...cmds];

    this.setMaxPrefix(cmds);

    // check if should handle input and subscribe.
    if (this.options.pipeInput)
      this.handleInput(this.options.pipeInput);

    // Run each command.
    cmds.forEach(cmd => cmd.run());

  }

  /**
   * Runs by group name(s).
   * 
   * @param groups additional groups to be run.
   */
  runGroup(...groups: string[]) {

    if (!groups.length)
      throw createError(`At least one group must be specified to run groups.`);

    const commands = groups.reduce((a, c) => {

      if (!this.hasGroup(c))
        throw createError(`Failed to lookup commands for unknown group ${c}.`);

      const cmds = this.getGroup(c);

      return [...a, ...cmds];

    }, [] as Command[]);

    if (!commands.length)
      return;

    this.run(...commands);

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
    const cmds = commands.length ? commands.map(c => this.get(c)) : [...this.indexes];
    cmds.forEach(cmd => {
      cmd.kill();
    });
  }

  handleInput(command: string | Command) {
    const cmd = this.get(command);
    const subscription = fromEvent(process.stdin, 'data')
      .pipe(map(data => data.toString()))
      .subscribe(data => {
        const name = (cmd && cmd.name) || 'anonymous';
        if (!cmd || !cmd.stdin)
          throw createError(`Cannot pipe input stream, command ${name} unknown or has not stdin currently open.`);
        cmd.stdin.write(data);
      });
    // push the subscription to command so 
    // it can be unsubscribed.
    if (cmd)
      cmd.subscriptions.push(subscription);
    return this;
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

          if (cmd.process)
            cmd.process.emit('close', -9999, signal);

        });
        // could write to stdin or line by line but
        // these ends up a bit cleaner in term IMO.
        const output = ('\n' + lines.join('\n'));

        this.log(output);

      });

    });

  }

}