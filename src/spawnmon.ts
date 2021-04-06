import { Command } from './command';
import { ISpawnmonOptions, ICommandOptions, } from './types';

const SPAWNMON_DEFAULTS: ISpawnmonOptions = {
  writestream: process.stdout
};

export class Spawnmon {

  commands = new Map<string, Command>();

  options: ISpawnmonOptions;

  constructor(options?: ISpawnmonOptions) {
    this.options = { ...SPAWNMON_DEFAULTS, ...options };
  }

  get pids() {
    return [...this.commands.values()].map(cmd => cmd.pid);
  }

  /**
   * Writes output to the default or user specified stream.
   * 
   * @param data the data to be written.
   */
  async writer(data: string | Buffer) {
    const result = await this.options.writestream.write(data);
    if (!result)
      console.error('Whoops failed to write output.');
  }

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
  add(nameOrOptions: string | ICommandOptions, commandArgs?: any[], initOptions?: ICommandOptions) {

    let options = nameOrOptions as ICommandOptions;

    if (typeof nameOrOptions === 'object' && nameOrOptions !== null) {
      initOptions = undefined;
      commandArgs = undefined;
    }
    else {
      options = {
        command: nameOrOptions as string,
        args: commandArgs,
        ...initOptions
      };
    }

    const cmd = new Command(options,  this);
    this.commands.set(cmd.command, cmd);
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
    names.forEach(k => {
      const command = this.commands.get(k);
      command.kill();
    });
  }

  /**
   * Helper to enabled catching uncaught and unhanded rejection errors.
   * Typically not needed but can be helpful when issues arise.
   */
  enableUncaughtExceptions() {

    const handler = (err: Error) => this.writer(err.stack + '\n');

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