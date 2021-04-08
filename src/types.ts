import { SpawnOptions, ProcessEnvOptions } from 'child_process';
import { StylesType, StyleFunction } from 'ansi-colors';
import { SocketConstructorOpts } from 'net';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';

// COMMAND
//----------------------------------------

export type EventSubscriptionType = 'stdout' | 'stderr' | 'error' | 'close' | 'stdin';

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
  pinger?: Pinger | IPingerOptions;
  timer?: SimpleTimer | ISimpleTimerOptions;
  indexed?: boolean; // when false is not pushed to indexed runnable commands.
}

export interface ISpawnmonOptions extends ProcessEnvOptions {
  writestream?: NodeJS.WritableStream;
  transform?: TransformHandler;
  prefix?: 'index' | 'command'; // when present use index of command or command name.
  prefixMax?: number;           // max length of prefix before truncating.
  prefixDefaultColor?: Color;
  prefixTemplate?: string;      // a string template to build prefix from.
  prefixAlign?: 'left' | 'right' | 'center';
  prefixFill?: string;          // the repeat fill when matching prefix width.
  condensed?: boolean;          // when true console output strips empty lines.
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
  name?: string;  // updated to command name if not defined.
  host?: string;  // default 127.0.0.1
  port?: number;  // default 3000
  attempts?: number; // default 10
  timeout?: number; // default 1800
  onConnected?: PingerHandler;
}

// TIMER
//----------------------------------------

export type SimpleTimerEvent = 'timeout' | 'condition' | 'update';

export type SimpleTimerHandler = (elapased?: number, timer?: SimpleTimer) => void;

export interface ISimpleTimerOptions {
  name?: string;    // updated to command name if not defined.
  interval?: number;
  timeout?: number;
  // called to check if condition is met, return true if it is.
  condition?: (previous?: number, current?: number, timer?: SimpleTimer) => boolean;
  onCondition?: SimpleTimerHandler;
}

// MISC
//----------------------------------------

export type Color = keyof StylesType<StyleFunction>;

