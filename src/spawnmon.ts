import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, Color, } from './types';
import { colorize, truncate } from './utils';

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
  condensed: false
};

export class Spawnmon {

  commands = new Map<string, Command>();
  running = false;
  indexes: string[] = [];
  maxPrefix = 0; // updated before run.

  options: ISpawnmonOptions;

  constructor(options?: ISpawnmonOptions) {
    this.options = { ...SPAWNMON_DEFAULTS, ...options };
    this.handleSignals();
  }

  private setMaxPrefix(commands: string[]) {
    const max = Math.max(0, ...commands.map(v => v.length));
    this.maxPrefix = max > this.options.prefixMax ? this.options.prefixMax : max;
  }

  private prepareOutput(data: string) {
    data = data.toString();
    if (!/\n$/.test(data))
      data += '\n';
    if (/\n\n$/.test(data))
      data = data.replace(/\n\n$/, '\n');
    return data;
  }

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
   * Outputs data to specified write stream.
   * 
   * @param data the data to write out to the write stream.
   * @param shouldKill when true should exist after writing.
   */
  async write(data: string | Error, shouldKill = false) {
    if (data instanceof Error)
      throw data;
    await this.options.writestream.write(this.prepareOutput(data));
    if (shouldKill)
      this.kill();
  }

  /**
   * Gets process id's of commands.
   */
  get pids() {
    return [...this.commands.values()].map(cmd => cmd.pid);
  }

  formatPrefix(command: string, color: Color = this.options.prefixDefaultColor) {

    let prefix = '';
    const cmd = this.commands.get(command);

    // prefix disabled or command is not auto runnable, return empty string.
    if (!this.options.prefix || !cmd.options.indexed)
      return prefix;

    const template = this.options.prefixTemplate;
    const templateLen = template.replace('{{prefix}}', '').length;
    const adjMax = this.maxPrefix - templateLen;

    prefix = this.options.prefix === 'command' ? command : this.getIndex(command) + '';

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
   * Gets the index of a command.
   * 
   * @param command the command name to get an index for.
   */
  getIndex(command: string) {
    return this.indexes.indexOf(command);
  }

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

  add(
    nameOrOptions: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptions?: Omit<ICommandOptions, 'command' | 'args'>,
    as?: string) {

    if (nameOrOptions instanceof Command) {

      const aliasOrName = typeof commandArgs === 'string' ? commandArgs : nameOrOptions.command;
      this.commands.set(aliasOrName, nameOrOptions);

      if (nameOrOptions.options.indexed)
        this.indexes.push(nameOrOptions.command);

      return nameOrOptions;

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

    if (cmd.options.indexed)
      this.indexes.push(aliasOrName as string);

    return cmd;

  }

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

  run(...commands: string[]) {
    if (!commands.length)
      commands = [...this.commands.keys()];
    // auto run ONLY indexed commands.
    commands = commands.filter(c => this.indexes.includes(c));
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

  kill(...names: string[]) {
    if (!names.length)
      names = [...this.commands.keys()];
    this.running = false;
    names.forEach(k => {
      const command = this.commands.get(k);
      command.kill();
    });
  }

  handleSignals() {
    const signals = ['SIGINT', 'SIGHUP', 'SIGTERM'] as NodeJS.Signals[];
    signals.forEach(signal => {
      process.on(signal, () => {
        const output = [];
        [...this.commands.values()].forEach(cmd => {
          output.push((colorize(`${cmd.command} recived signal ${signal}.`, 'dim')));
        });
        this.write('\n' + output.join('\n'));
      });
    });
  }

  /**
   * Helper to enabled catching uncaught and unhanded rejection errors.
   * Typically not needed but can be helpful when issues arise.
   */
  enableUncaughtExceptions() {

    const handler = (err: Error) => this.write(err.stack + '\n');

    const unsubscribe = () => {
      process.off('uncaughtException', handler);
      process.off('unhandledRejection', handler);
    };

    const subscribe = () => {
      process.on('uncaughtException', handler);
      process.on('unhandledRejection', handler);
      return unsubscribe;
    };

    // Ensure initially disabled.
    unsubscribe();

    // subscribe and return unsubscribe.
    return subscribe();

  }


}