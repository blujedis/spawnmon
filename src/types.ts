import { SpawnOptions, ProcessEnvOptions } from 'child_process';
import { StylesType, StyleFunction } from 'ansi-colors';
import { SocketConstructorOpts } from 'net';
import { Pinger } from './pinger';

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
  args?: string[];
  transform?: TransformHandler;
  color?: Color;
  mute?: boolean;
  condensed?: boolean;
  delay?: number;
  onIdle?: () => void;
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
  host?: string;
  port?: number;
  attempts?: number;
  delay?: number;
}

// MISC
//----------------------------------------

export type Color = keyof StylesType<StyleFunction>;

export interface IMonitorOptions {
  name?: string;
  interval?: number;
  timeout?: number;
  until?: (previous: number, current: number, intervalId: NodeJS.Timeout) => boolean;
  done: () => void;
  onMessage?: (message: string) => void;
}