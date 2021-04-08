
import spawn from 'cross-spawn';
import { fromEvent, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChildProcess, SpawnOptions } from 'child_process';
import { Readable, Writable } from 'stream';
import { Spawnmon } from './spawnmon';
import treekill from 'tree-kill';
import { chomp, isBlankLine, createTimer, SimpleTimer, colorize } from './utils';
import { EventSubscriptionType, ICommandOptions, IMonitorOptions, ITransformMetadata, TransformHandler } from './types';
import { Pinger } from './pinger';

const COMMON_DEFAULTS: ICommandOptions = {
  command: '',
  args: [],
  condensed: false,
  delay: 0
};

export class Command {

  private delayTimeoutId: NodeJS.Timeout;
  private timer: SimpleTimer;

  child: ChildProcess;
  subscriptions: Subscription[] = [];

  options: ICommandOptions;
  spawnmon: Spawnmon;
  stdin: any;

  constructor(options: ICommandOptions, spawnmon?: Spawnmon) {
    const { prefixDefaultColor, condensed } = spawnmon.options;
    this.options = { ...COMMON_DEFAULTS, color: prefixDefaultColor, condensed, ...options };
    if (options.onIdle)
      this.onIdle(options.onIdle);
    this.spawnmon = spawnmon;
  }

  /**
   * Prepares options and command arguments. 
   * Ensures we're always getting the lastest.
   * looks a mess here but simplifies options
   * object for the user.
   */
  private get prepare(): [string, string[], SpawnOptions] {
    const { command, args, transform, color, ...rest } = this.options;
    const { uid, gid, env, cwd } = this.spawnmon.options;
    const options = { uid, gid, env, cwd, ...rest } as SpawnOptions;
    return [command, args, options];
  }

  private write(data: string | Error, shouldKill = false) {
    if (typeof data === 'string')
      data = this.format(data);
    this.updateTimer(shouldKill);
    this.spawnmon.write(data, shouldKill);
  }

  /**
   * Gets the line prefix if enabled.
   */
  private getPrefix(unpadded = false) {
    const prefix = this.spawnmon.formatPrefix(this.command, this.options.color);
    if (unpadded)
      return prefix;
    return prefix + ' ';
  }

  /**
   * Checks if out put should be condensed.
   * 
   * @param data the data to inspect for condensed format.
   */
  private format(data: string) {

    const prefix = this.getPrefix();

    data = data.replace(/\u2026/g, '...');

    let lines = data.split('\n');
    const lastIndex = lines.length - 1;

    lines = lines.reduce((results, line, index) => {

      // Empty line condensed on ignore it.
      if (this.options.condensed && (isBlankLine(line) || !line.length))
        return results;

      const inspect = line.replace(/[^\w]/gi, '').trim();

      if (lines.length > 1 && lastIndex === index && !inspect.length)
        return results;

      // Ansi escape resets color that may wrap from preceeding line.
      line = '\u001b[0m' + prefix + line;

      return [...results, line.trim()];

    }, []);

    // need to tweak this a bit so we don't get random prefix with blank line.
    return lines.join('\n').trim();

  }

  private updateTimer(stop = false) {
    if (!this.timer) return;
    if (stop)
      return this.timer.stop();
    this.timer.update();
  }

  /**
   * Subscribes to a child's stream.
   * 
   * @param from the stream the subscription is from.
   * @param input the readable, writable stream or child process.
   * @param transform the transform for output.
   */
  private subscribe(from: EventSubscriptionType, input: Readable | Writable | ChildProcess, transform?: TransformHandler) {

    let subscription: Subscription;

    // this is goofy should rework this soon.
    if (this.timer && !this.timer.running)
      this.timer.start();

    const metadata: ITransformMetadata = {
      command: this.command,
      from
    };

    if (from === 'stdin') {

      fromEvent<string | Buffer>(input as Readable, 'data')
        .subscribe(v => {
          if (this.stdin && this.child) {
            console.log('got input - ', v.toString());
            this.stdin.write(v.toString());
          }
        });
    }

    else if (from === 'error') {
      fromEvent<Error>(input as ChildProcess, 'error')
        .subscribe(err => {
          // DO NOT allow muting of errors.
          this.child = undefined;
          this.write(err, true);
        });
    }

    else if (from === 'close') {
      fromEvent<number>(input as ChildProcess, 'close')
        .subscribe(code => {
          if (!this.options.mute)
            this.write(`${this.command} exited with code ${code}`);
          this.child = undefined;
        });
    }

    else {
      transform = transform || this.transform;
      subscription =
        fromEvent<string | Buffer>(input, 'data')
          .pipe(map(e => transform(chomp(e), metadata)))
          .subscribe(v => {
            if (!this.options.mute)
              this.write(v);
          });

    }

    this.subscriptions.push(subscription);

  }

  /**
   * Internal method for spawning command.
   * 
   * @param transform optional transform to past to streams. 
   */
  private spawnCommnad(transform?: TransformHandler) {
    this.child = spawn(...this.prepare);
    this.child.stdout && this.subscribe('stdout', this.child.stdout, transform);
    this.child.stderr && this.subscribe('stderr', this.child.stderr, transform);
    this.stdin = this.child.stdin;
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
    this.subscriptions.forEach(sub => {
      if (!sub.closed)
        sub.unsubscribe();
    });
    return this;
  }

  pingAfter(pinger: Pinger, condition: () => boolean) {

  }

  /**
   * Calls a callback when condition is met and output is idle.
   * 
   * @param interval the time interval to ping at.
   * @param cb a callback to be called when condition is met.
   */
  onIdle(interval: number, cb: () => void): this;

  /**
  * Calls a callback when condition is met and output is idle.
  * 
  * @param cb a callback to be called when condition is met.
  */
  onIdle(cb: () => void): this;

  /**
  * Calls a callback when condition is met and output is idle.
  * 
  * @param options the time timer configuration object.
  */
  onIdle(options: IMonitorOptions): this;
  onIdle(optionsOrCallback?: IMonitorOptions | (() => void) | number, cb?: () => void) {

    let options = optionsOrCallback as IMonitorOptions;

    if (typeof optionsOrCallback === 'function') {
      options = {
        done: optionsOrCallback
      };
    }

    else if (typeof optionsOrCallback === 'boolean') {
      options = {
        interval: optionsOrCallback,
        done: cb
      };
    }

    this.timer = createTimer({
      name: this.command,
      onMessage: (m) => {
        this.write(colorize(m, 'yellow'));
      },
      ...options
    });

    return this;

  }

  /**
   * Runs the command.
   * 
   * @param transform optional tranform, handy when calling programatically.
   */
  run(transform?: TransformHandler) {
    if (!this.options.delay)
      return this.spawnCommnad(transform);
    this.delayTimeoutId = setTimeout(() => this.spawnCommnad(transform), this.options.delay);
    return this;
  }

  /**
   * Kills the command if process still exists.
   */
  kill(signal?: NodeJS.Signals, cb?: (err?: Error) => void) {
    // not entirely need but...
    clearTimeout(this.delayTimeoutId);
    if (this.timer)
      this.timer.stop();
    !!this.child && treekill(this.pid, signal, (err) => {
      if (cb) cb(err);
    });
  }


}
