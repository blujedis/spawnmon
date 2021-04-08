
import spawn from 'cross-spawn';
import { fromEvent, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChildProcess, SpawnOptions } from 'child_process';
import { Readable, Writable } from 'stream';
import { Spawnmon } from './spawnmon';
import treekill from 'tree-kill';
import { chomp, isBlankLine, colorize } from './utils';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
import { EventSubscriptionType, ICommandOptions, IPingerOptions, ISimpleTimerOptions, ITransformMetadata, PingerHandler, SimpleTimerHandler, TransformHandler } from './types';

const COMMON_DEFAULTS: ICommandOptions = {
  command: '',
  args: [],
  condensed: false,
  delay: 0,
  indexed: true
};

export class Command {

  private delayTimeoutId: NodeJS.Timeout;

  timer: SimpleTimer;
  pinger: Pinger;
  child: ChildProcess;
  subscriptions: Subscription[] = [];

  options: ICommandOptions;
  spawnmon: Spawnmon;
  stdin: any;

  constructor(options: ICommandOptions, spawnmon?: Spawnmon) {
    const { prefixDefaultColor, condensed } = spawnmon.options;
    options = { ...COMMON_DEFAULTS, color: prefixDefaultColor, condensed, ...options };
    let { pinger, timer } = options;
    if (pinger) {
      if (!(pinger instanceof Pinger))
        pinger = new Pinger(pinger as IPingerOptions);
    }
    if (timer) {
      if (!(timer instanceof SimpleTimer))
        timer = new SimpleTimer(timer as ISimpleTimerOptions);
    }
    this.options = options;
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

    //  data = data.replace(/\u2026/g, '...');

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

  /**
   * Updates the timer issuing a new tick for the counters.
   * 
   * @param stop when true tells timer to stop. 
   */
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

    // if Timer exists ensure it is running.
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
  private spawnCommand(transform?: TransformHandler) {
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

  /**
  * Creates Pinger instance using default options with provided
  * onConnected callback and timeout.
  * 
  * @param timeout the timeout duration between tries.
  * @param onConnected a callback to be called when connected to socket.
  */
  setPinger(timeout: number, onConnected: PingerHandler): this;

  /**
  * Creates Pinger instance using default options with provided on connected callback.
  * 
  * @param onConnected a callback to be called when connected to socket.
  */
  setPinger(onConnected: PingerHandler): this;

  /**
  * Creates Pinger instance using the provided options.
  * 
  * @param options the time Pinger configuration object.
  */
  setPinger(options: IPingerOptions): this;
  setPinger(optionsOrCallback?: IPingerOptions | PingerHandler | number, onConnected?: PingerHandler) {

    if (this.pinger)
      return this;

    let options = optionsOrCallback as IPingerOptions;

    if (typeof optionsOrCallback === 'function') {
      onConnected = optionsOrCallback;
      optionsOrCallback = undefined;
    }

    else if (typeof optionsOrCallback === 'number') {
      options = {
        timeout: optionsOrCallback
      };
    }

    this.pinger = new Pinger({
      name: this.command,
      onConnected,
      ...options
    });

    return this;

  }

  /**
   * Creates Timer using interval and onCondition callback.
   * 
   * @param interval the time interval to ping at.
   * @param onCondition a callback to be called when condition is met.
   */
  setTimer(interval: number, onCondition: SimpleTimerHandler): SimpleTimer;

  /**
  * Creates Timer using onCondition callback.
  * 
  * @param onCondition a callback to be called when condition is met.
  */
  setTimer(onCondition: SimpleTimerHandler): SimpleTimer;

  /**
  * Creates Timer using the specified options for configuration.
  * 
  * @param options the time timer configuration object.
  */
  setTimer(options?: ISimpleTimerOptions): SimpleTimer;
  setTimer(optionsOrCallback?: ISimpleTimerOptions | SimpleTimerHandler | number, onCondition?: SimpleTimerHandler) {

    if (this.timer)
      return this.timer;

    let options = optionsOrCallback as ISimpleTimerOptions;

    if (typeof optionsOrCallback === 'function') {
      onCondition = optionsOrCallback;
      optionsOrCallback = undefined;
    }

    else if (typeof optionsOrCallback === 'boolean') {
      options = {
        interval: optionsOrCallback,
      };
    }

    this.timer = new SimpleTimer({
      name: this.command,
      onCondition,
      ...options
    });

    const msg = `${this.command} timer expired before condition.`;
    this.timer.on('timeout', () => this.write(colorize(msg, 'yellow')));

    return this.timer;

  }

  /**
   * Adds a new command to the queue.
   * 
   * @param command the command to be executed.
   * @param args the arguments to be pased.
   * @param options additional command options.
   * @param as an alias name for the command.
   */
  runConnected(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;

  /**
   * Adds existing Command to Spawnmon instance..
   * 
   * @param command a command instance.
   */
  runConnected(command: Command): Command;

  /**
   * Adds a new command to the queue by options object.
   * 
   * @param options the command configuration obtions.
   */
  runConnected(options: ICommandOptions): Command;

  runConnected(
    nameOrOptions: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptions?: Omit<ICommandOptions, 'command' | 'args'>,
    as?: string) {

    let cmd = nameOrOptions as Command;

    // lookup command or create.
    if (typeof nameOrOptions === 'string')
      cmd = this.spawnmon.commands.get(nameOrOptions);

    // if we get here this is a new command
    // with args, options etc call parent add
    // but specify not to index.
    if (!cmd && typeof nameOrOptions !== 'undefined') {

      // Just some defaults so the add function 
      // knows how to handle. 
      initOptions = {
        indexed: false,
        ...initOptions
      };

      // No need to worry about positions of args here
      // the .add() method in the core will sort it out.
      cmd = this.spawnmon.add(nameOrOptions as string, commandArgs, initOptions, as);

    }

    if (!cmd)
      return null;

    this.timer = this.timer || this.setTimer();

    this.timer.on('condition', (elapsed) => {
      console.log('Elapased time', (new Date(elapsed)).toISOString());
    });

    return cmd;

  }

  /**
   * Runs the command.
   * 
   * @param transform optional tranform, handy when calling programatically.
   */
  run(transform?: TransformHandler) {
    if (!this.options.delay)
      return this.spawnCommand(transform);
    this.delayTimeoutId = setTimeout(() => this.spawnCommand(transform), this.options.delay);
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
