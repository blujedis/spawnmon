
import spawn from 'cross-spawn';
import { fromEvent, Subscription } from 'rxjs';
// import { map } from 'rxjs/operators';
import { ChildProcess, SpawnOptions } from 'child_process';
import { Readable } from 'stream';
import { Spawnmon } from './spawnmon';
import { ICommandOptions, TransformHandler } from './types';

const COMMON_DEFAULTS: ICommandOptions = {
  command: '',
  args: []
};

export class Command {

  child: ChildProcess;
  subscriptions: Subscription[] = [];

  options: ICommandOptions;
  spawnmon: Spawnmon;

  constructor(options: ICommandOptions, spawnmon?: Spawnmon) {
    this.options = { ...COMMON_DEFAULTS, ...options };
    this.spawnmon = spawnmon;
  }

  /**
   * Prepares options and command arguments. 
   * Ensures we're always getting the lastest.
   */
  private get prepare(): [string, string[], SpawnOptions] {
    const { command, args, transform, color, prefix, ...rest } = this.options;
    const { uid, gid, env, cwd } = this.spawnmon.options;
    const options = { uid, gid, env, cwd, ...rest } as SpawnOptions;
    return [command, args, options];
  }

  /**
   * Subscribes to a child's stream.
   * 
   * @param from the stream the subscription is from.
   * @param stream the readable stream to get event from.
   * @param transform the transform for output.
   */
  private subscribe(from: 'stdout' | 'stderr', stream: Readable, transform?: TransformHandler) {
    // .pipe(map(e => e))
    transform = transform || this.transform;
    const subscription =
      fromEvent<string | Buffer>(stream, 'data')
        .subscribe(v => transform(v.toString(), this.command, from));
    this.subscriptions.push(subscription);
  }

  /**
   * Gets the process id if active.
   */
  get pid() {
    return this.child.pid;
  }

  /**
   * Gets the defined command name itself.
   */
  get command() {
    return this.options.command;
  }

  /**
   * Gets the command arguments.
   */
  get args() {
    return this.options.args || [];
  }

  /**
   * Gets the normalized output transform.
   */
  get transform() {
    return this.options.transform || this.spawnmon.options.transform;
  }

  /**
   * Sets the options object.
   * 
   * @param options options object to update or set to.
   * @param merge when true options are merged with existing.
   */
  setOptions(options: ICommandOptions, merge = true) {
    if (merge)
      this.options = { ...this.options, ...options };
    else
      this.options = options;
    return this;
  }

  /**
   * Unsubscribes from all subscriptions.
   */
  unsubscribe() {
    this.subscriptions.forEach(s => s.unsubscribe());
    return this;
  }

  /**
   * Runs the command.
   * 
   * @param transform optional tranform, handy when calling programatically.
   */
  run(transform?: TransformHandler) {
    this.child = spawn(...this.prepare);
    this.child.stdout && this.subscribe('stdout', this.child.stdout, transform);
    this.child.stderr && this.subscribe('stderr', this.child.stderr, transform);
    return this;
  }

  /**
   * Kills the command if process still exists.
   */
  kill() {
    this.unsubscribe();
    this.child && this.child.kill();
  }


}
