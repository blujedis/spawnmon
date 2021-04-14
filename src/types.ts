import { SpawnOptions, ProcessEnvOptions } from 'child_process';
import { SocketConstructorOpts } from 'net';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';

// COMMAND & SPAWNMAN
//----------------------------------------

export type EventSubscriptionType = 'stdout' | 'stderr' | 'error' | 'close';

export type PrefixKey = 'index' | 'pid' | 'command' | 'timestamp';

export interface ITransformMetadata {
  command: string;
  from: EventSubscriptionType;
  signal?: NodeJS.Signals;
  [key: string]: any;
}

export type TransformHandler = (line: string | Buffer | Error, metadata?: ITransformMetadata) => string;

export interface ICommandOptions extends SpawnOptions {
  command: string;
  as?: string;
  args?: string[];
  transform?: TransformHandler;
  color?: Color;
  mute?: boolean;
  condensed?: boolean;
  delay?: number;
  pinger?: IPingerOptions | PingerHandler;
  timer?: ISimpleTimerOptions | SimpleTimerHandler;
}

export interface ISpawnmonOptions extends ProcessEnvOptions {
  writestream?: NodeJS.WritableStream;
  transform?: TransformHandler;
  prefix?: string;                // index, pid, command, timestamp
  prefixMax?: number;             // max length of prefix before truncating.
  prefixAlign?: 'left' | 'right' | 'center';
  prefixFill?: string;            // the repeat fill when matching prefix width.
  defaultColor?: Color;           // default color used for prefix etc.
  condensed?: boolean;            // when true console output strips empty lines.
  handleSignals?: boolean;        // when true handles SIGINT, SIGTERM, SIGHUP signals...
  raw?: boolean;                  // when true logging is output without formatting.
  maxProcesses?: number;          // the max number of spawned child processes. 
  onTimestamp?: () => string;     // user defined func to get timestamps. 
}

// PINGER
//----------------------------------------

export type PingerEvent = 'retry' | 'failed' | 'connected' | 'destroyed';

export type PingerHandler = (retries?: number, pinger?: Pinger) => void;

export interface IPinger {
  on(event: PingerEvent, handler: PingerHandler): void;
  off(event: PingerEvent, handler: PingerHandler): void;
}

export interface IPingerOptions extends SocketConstructorOpts {
  active?: boolean;
  name?: string;                  // updated to command name if not defined.
  target?: string;                // name of existing command to run.
  host?: string;                  // default 127.0.0.1
  port?: number;                  // default 3000
  attempts?: number;              // default 10
  timeout?: number;               // default 1800
  onConnected?: PingerHandler;
  autoStop?: boolean;
}

// TIMER
//----------------------------------------

export type SimpleTimerEvent = 'timeout' | 'condition' | 'update';

export type SimpleTimerHandler = (update: any, counters?: ISimpleTimerCounters, timer?: SimpleTimer) => void;

export interface ISimpleTimerOptions {
  active?: boolean;  // timer inits w/ ea. command but may not need to be active.
  name?: string;    // updated to command name if not defined.
  target?: string; // name of command to run as target.
  interval?: number;
  timeout?: number;
  // called to check if condition is met, return true if it is.
  condition?: (update: any, counters?: ISimpleTimerCounters, timer?: SimpleTimer) => boolean;
  onCondition?: SimpleTimerHandler;
}

export interface ISimpleTimerCounters {
  counter: number;
  previousCounter: number;
  startTime: number;
  endTime: number;
  elasped: number;
}

// MISC
//----------------------------------------

export type Color = string; // keyof StylesType<StyleFunction>;

