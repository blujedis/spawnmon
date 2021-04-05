import { spawn as spawnAsync, spawnSync, ChildProcess, SpawnSyncReturns } from 'child_process';
import { ApiFor, CommandTuple, SpawnOptionsExt, TransformHandler, SpawnOptionsSyncExt } from './types';
import utils from './utils';

export type ApiBase = ReturnType<typeof createRunner>;

const { writeLines, defaultWriteHandler } = utils;

const _baseDefaults: SpawnOptionsExt = {
  stdio: [process.stdin, 'pipe', process.stderr],
  writestream: 'stdout'
};

export function createRunner(defaultTransform: TransformHandler | SpawnOptionsExt = defaultWriteHandler, defaultSpawnOptions = { ..._baseDefaults }) {

  if (typeof defaultTransform === 'object' && defaultTransform !== null) {
    defaultSpawnOptions = defaultTransform as SpawnOptionsExt;
    defaultTransform = undefined;
  }

  defaultSpawnOptions = defaultSpawnOptions || {};

  let _processes = [] as (ChildProcess | SpawnSyncReturns<Buffer>)[];
  let _commands = [] as CommandTuple[];
  let _delays = [] as number[]; // temp hack.

  const api = {
    get processes() { return _processes; },
    get commands() { return _commands; },
    toTuple,
    add,
    run,
    runAll,
    kill,
    reset,
    utils
  };

  // Helpers.

  /**
   * Ensures all config tuple parmams are normalized.
   * 
   * @param cmd the spawn command.
   * @param args the spawn arguments.
   * @param opts the spawn options.
   * @param transform optional tranform function.
   */
  function toTuple(cmd: string, args: any[] | SpawnOptionsExt | TransformHandler, opts: SpawnOptionsExt | TransformHandler, transform: TransformHandler) {

    if (typeof args === 'function') {
      transform = args as TransformHandler;
      opts = undefined;
      args = undefined;
    }

    if (typeof args === 'object' && !Array.isArray(args) && args !== null) {
      opts = args as SpawnOptionsExt;
      args = undefined;
    }

    if (typeof opts === 'function') {
      transform = opts;
      opts = undefined;
    }

    args = args || [];
    opts = { ...defaultSpawnOptions, ...(opts || {}) };

    return [cmd, args, opts, transform] as CommandTuple;

  }

  // Common.

  /**
   * Kills processes by pid.
   * 
   * @param pids the process id's to kill otherwise all are killed.
   */
  function kill(...pids: number[]) {
    if (!pids.length)
      pids = api.processes.map(proc => proc.pid);
    pids.forEach((pid) => {
      if (pid)
        process.kill(pid);
    });
  }

  /**
   * Resets processes so that all can be run again.
   * 
   * @param all resets all properties.
   */
  function reset(all = false) {
    _processes = [];
    if (all)
      _commands = [];
    return api;
  }

  // Instance (only run, kill and transform per instance)

  function add(cmd: string, args?: any[] | SpawnOptionsExt | TransformHandler, opts?: SpawnOptionsExt | TransformHandler, transform?: TransformHandler) {

    const conf = toTuple(cmd, args, opts, transform);
    api.commands.push(conf);
    const idx = api.commands.indexOf(conf);

    // Create a new api.
    const _api = Object.create(api) as ApiFor;
    (_api as any).options = {};

    Object.defineProperty(_api, 'child', {
      value: () => {
        return _api.options.child;
      }
    });

    _api.run = (tform) => {
      // user may have added transform add to conf if found.
      if (!conf[3]) {
        tform = tform || _api.options.transform;
        conf[3] = tform;
      }

      _api.options.child = run(...conf);

      return _api;

    };

    _api.delay = (delay = 1000) => {
      _api.options.delay = delay;
      _delays[idx] = delay;
      return _api;
    };

    _api.transform = (handler) => {
      _api.options.transform = handler;
      conf[3] = _api.options.transform;
      return _api;
    };

    _api.kill = () => {
      if (_api.options.child && _api.options.child.pid)
        process.kill(_api.options.child.pid);
    }

    return _api as unknown as ApiFor;

  }

  function createMonitor(tick: number, cb: () => void) {

    let ctr = 0;
    let prevCtr = 0;
    let timeoutId;
    let running = false;

    function update() {
      ctr += 1;
    }

    function start() {
      if (timeoutId) clearTimeout(timeoutId);
      running = true;
      timeoutId = setInterval(function () {
        console.log(prevCtr, ctr)
        if (prevCtr && ctr === prevCtr)
          return stop();
        prevCtr = ctr;
      }, tick || 2000);
    }

    function stop() {
      clearTimeout(timeoutId);
      running = false;
    }

    return {
      ctr,
      prevCtr,
      running,
      update,
      start,
      stop
    };

  }

  function run(initCmd: string, argsOptsOrHandler?: any[] | SpawnOptionsExt | TransformHandler, optsOrHandler?: SpawnOptionsExt | TransformHandler, initTransform?: TransformHandler) {

    // normalize all of our options.
    const [cmd, args, opts, transform] = toTuple(initCmd, argsOptsOrHandler, optsOrHandler, initTransform);

    const stdio = opts.stdio;

    // Pipe must be enabled for the write stream that's selected.
    // stdio is otherwise kept as defined by user.
    if (opts.writestream === 'stderr') {
      opts.stdio = [stdio[0], 'inherit', 'pipe'] as any;
    }
    else if (opts.writestream === 'stdout') {
      opts.stdio = [stdio[0], 'pipe', stdio[2]] as any;
    }

    // create the child process.
    const child = spawnAsync(cmd, args, opts);
    api.processes.push(child);

    // determine which stream to output to the console.
    // some commands/programs write only to stderr so we
    // give the option of where to output to.
    const stream = opts.writestream === 'stderr' ? child.stderr : child.stdout;

    // create monitor.
    const mon = createMonitor(2500, () => {
      console.log('timeout', mon.ctr);
    });

    // On each data update counters.
    stream.on('data', mon.update);

    // Write the lines to the console.
    (async () => {
      if (!mon.running)
        mon.start();
      await writeLines(stream, transform);
    })();

    // Return the spawned process for good measure.
    return child;

  }

  function runAfter(delay: number, command: (...args: any[]) => any, args: any[]) {
    if (!delay)
      return command(...args);
    setTimeout(() => {
      command(...args);
    }, delay || 0);
  }

  /**
   * Runs all spawn configurations.
   * 
   * @param confs array of spawn configuration options.
   */
  function runAll(confs: CommandTuple[] = api.commands) {
    confs.forEach(conf => {
      const isSync = (conf as any).length === 5;
      const idx = api.commands.indexOf(conf);
      const delay = _delays[idx];

      if (isSync) {
        conf.pop();
        runAfter(delay, run, conf);
      }
      else {
        runAfter(delay, run, conf);
      }
    });
    return api;
  }


  return api;

}

export default createRunner();





