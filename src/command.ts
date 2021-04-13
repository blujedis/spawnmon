
import spawn from 'cross-spawn';
import { fromEvent, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChildProcess, SpawnOptions } from 'child_process';
import { Readable, Writable } from 'stream';
import { Spawnmon } from './spawnmon';
import treekill from 'tree-kill';
import { colorize, createError, } from './utils';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
import { EventSubscriptionType, ICommandOptions, ITransformMetadata, PingerHandler, SimpleTimerHandler, TransformHandler } from './types';

const COMMAND_DEFAULTS: ICommandOptions = {
  command: '',
  args: [],
  condensed: false,
  delay: 0
};

export class Command {

  private delayTimeoutId: NodeJS.Timeout;
  private timerHandlers = [] as SimpleTimerHandler[];
  private pingerHandlers = [] as PingerHandler[];

  spawnmon: Spawnmon;
  parent: Command;
  process: ChildProcess;
  spawnmonChild: Spawnmon;

  subscriptions: Subscription[] = [];
  stdin: Writable;
  prefixCache: string;

  timer: SimpleTimer;
  pinger: Pinger;

  options: ICommandOptions;

  constructor(options: ICommandOptions, spawnmon: Spawnmon, parent?: Command) {

    const { defaultColor, condensed } = spawnmon.options;

    options = {
      ...COMMAND_DEFAULTS,
      color: defaultColor,
      condensed,
      timer: {},
      pinger: {},
      ...options
    };

    if (/^win/.test(process.platform))
      options.detached = false;

    const { pinger, timer } = options;

    // Timer/Pinger set to "active: false" because
    // when used internally must call method 
    // to enable as active.

    this.pinger = new Pinger(typeof pinger === 'function'
      ? { active: false, onConnected: pinger }
      : { active: false, ...pinger });


    this.timer = new SimpleTimer(typeof timer === 'function'
      ? { active: false, onCondition: timer as SimpleTimerHandler }
      : { active: false, ...timer }) as SimpleTimer;

    this.options = options;
    this.spawnmon = spawnmon;
    this.parent = parent;

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

  /**
   * Updates the timer issuing a new tick for the counters.
   * 
   * @param stop when true tells timer to stop. 
   */
  private updateTimer(data: string | Error, stop = false) {
    if (!this.timer)
      return;
    if (stop)
      return this.timer.stop();
    this.timer.update(data);
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
      command: this.name,
      from
    };

    if (from === 'error') {
      fromEvent<Error>(input as ChildProcess, 'error')
        .subscribe(err => {
          // DO NOT allow muting of errors.
          this.process = undefined;
          this.log(err, true);
        });
    }

    else if (from === 'close') {
      fromEvent(input as ChildProcess, 'close')
        .subscribe(([code, signal]) => {
          // if not muted and not handled signal output.
          if (!this.options.mute && !['SIGTERM', 'SIGINT', 'SIGHUP'].includes(signal))
            this.log(`${this.name} exited with ${signal}`);
          this.process = undefined;
        });
    }

    else {
      transform = transform || this.transform;
      subscription =
        fromEvent<string | Buffer>(input, 'data')
          .pipe(map(e => transform(e, metadata)))
          .subscribe(v => {
            if (!this.options.mute)
              this.log(v);
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
    this.process = spawn(...this.prepare);
    this.process.stdout && this.subscribe('stdout', this.process.stdout, transform);
    this.process.stderr && this.subscribe('stderr', this.process.stderr, transform);
    this.stdin = this.process.stdin;
    this.subscribe('close', this.process);
    this.subscribe('error', this.process);
  }

  /**
   * Some preflight we can't init until right before we run.
   */
  private beforeRun() {

    const { pinger, timer } = this.options;

    // If pinger contains a target command bind it.
    if (pinger && typeof pinger === 'object' && pinger.target)
      this.onPinger(pinger.target);

    // If timer contains a target command bind it.
    if (timer && typeof timer === 'object' && timer.target)
      this.onTimer(timer.target);

  }

  /**
   * Gets the process id if active.
   */
  get pid() {
    return this.process.pid;
  }

  /**
   * Gets the command's alias.
   */
  get name() {
    return this.options.as || this.options.command;
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
   * Log response from subscriptions.
   * 
   * @param data the data to be logged from the response.
   * @param shouldKill variable indicating Spawnmon should kill children.
   * @param shouldUpdate when true should update the timer which watches for idle commands
   */
  log(data: string | Error, shouldKill = false, shouldUpdate = true) {
    if (shouldUpdate)
      this.updateTimer(data, shouldKill);
    this.spawnmon.log(data, this, shouldKill);
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

  mute() {
    this.options.mute = true;
    return this;
  }

  unmute() {
    this.options.mute = false;
    return this;
  }

  /**
   * Unsubscribes from all subscriptions.
   */
  unsubscribe() {

    this.subscriptions.forEach(sub => {
      sub && !sub.closed && sub.unsubscribe();
    });

    this.timerHandlers.forEach(handler => {
      if (this.timer)
        this.timer.off('condition', handler);
    });

    this.pingerHandlers.forEach(handler => {
      if (this.pinger)
        this.pinger.off('connected', handler);
    });

    return this;
  }

  onPinger(handler: string | Command | PingerHandler) {
    let _handler = handler as PingerHandler;
    if (typeof handler === 'string' || handler instanceof Command) {
      const cmd = this.spawnmon.get(handler);
      if (!cmd)
        throw createError(`Failed to create Pinger handler using unknown command.`);
      _handler = (update, counters) => {
        cmd.run();
      };
    }
    this.pinger.on('connected', _handler);
  }

  onTimer(handler: string | Command | SimpleTimerHandler) {
    let _handler = handler as SimpleTimerHandler;
    if (typeof handler === 'string' || handler instanceof Command) {
      const cmd = this.spawnmon.get(handler);
      if (!cmd)
        throw createError(`Failed to create Timer handler using unknown command.`);
      _handler = (update, counters) => {
        cmd.run();
      };
    }
    this.timer.on('condition', _handler);
    this.timer.enable();

  }

  /**
   * Adds command to a group(s).
   * 
   * @param groups the name of the group(s) to add the command to.
   */
  assign(...groups: string[]) {
    groups.forEach(g => {
      this.spawnmon.assign(g, this);
    });
    return this;
  }

  /**
   * Unassigns a command from group(s).
   * 
   * @param groups the groups to remove/unassign the command from.
   */
  unassign(...groups: string[]) {
    groups.forEach(g => {
      this.spawnmon.unassign(g, this);
    });
  }

  /**
   * Adds a new sub command.
   * 
   * @param options the command configuration options.
   */
  child(options: ICommandOptions): Command;

  /**
  * Adds the command as a sub command.
  * 
  * @param command a command instance.
  * @param as an alias name for the command.
  */
  child(command: Command, as?: string): Command;

  /**
   * Adds a new sub command.
   * 
   * @param command the sub command to be executed.
   * @param args the arguments to be pased.
   * @param as an alias name for the command.
   */
  child(command: string, args?: string | string[], as?: string): Command;

  /**
   * Adds a new sub command.
   * 
   * @param command the sub command to be executed.
   * @param args the arguments to be pased.
   * @param options additional command options.
   * @param as an alias name for the command.
   */
  child(command: string, args?: string | string[], options?: Omit<ICommandOptions, 'command' | 'args'>, as?: string): Command;

  child(
    nameCmdOrOpts: string | ICommandOptions | Command,
    commandArgs?: string | string[],
    initOptsOrAs?: Omit<ICommandOptions, 'command' | 'args'> | string,
    as?: string) {

    // Create Spawnmon Child instance to manage subcommands.
    if (!this.spawnmonChild)
      this.spawnmonChild = new Spawnmon({ ...this.spawnmon.options });

    const cmd = this.spawnmonChild.create(nameCmdOrOpts as any, commandArgs, initOptsOrAs as any, as);

    // update with this command as its parent.
    if (cmd)
      cmd.parent = this;

    return this;

  }

  /**
   * Runs the command.
   * 
   * @param transform optional tranform, handy when calling programatically.
   */
  run(transform?: TransformHandler) {

    this.beforeRun();

    if (this.options.mute)
      this.log(colorize(`command ${this.name} is muted.`, 'yellow'), false, false);

    if (!this.options.delay)
      return this.spawnCommand(transform);

    this.delayTimeoutId = setTimeout(() => this.spawnCommand(transform), this.options.delay);

    return this;

  }

  /**
   * Kills the command if process still exists.
   */
  kill(signal?: NodeJS.Signals, cb?: (err?: Error) => void) {
    // some cleanup not really needed.
    clearTimeout(this.delayTimeoutId);
    if (this.timer)
      this.timer.stop();
    !!this.process && treekill(this.pid, signal, (err) => {
      if (cb) cb(err);
    });
  }


}
