/// <reference types="node" />
import { SpawnOptions, ProcessEnvOptions } from 'child_process';
import { StylesType, StyleFunction } from 'ansi-colors';
import { SocketConstructorOpts } from 'net';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
export declare type EventSubscriptionType = 'stdout' | 'stderr' | 'error' | 'close';
export interface ITransformMetadata {
    command: string;
    from: EventSubscriptionType;
    signal?: NodeJS.Signals;
    [key: string]: any;
}
export declare type TransformHandler = (line: string | Buffer | Error, metadata?: ITransformMetadata) => string;
export interface ICommandOptions extends SpawnOptions {
    command: string;
    as?: string;
    args?: string[];
    transform?: TransformHandler;
    color?: Color;
    mute?: boolean;
    condensed?: boolean;
    delay?: number;
    pinger?: Pinger | IPingerOptions | PingerHandler;
    timer?: SimpleTimer | ISimpleTimerOptions | SimpleTimerHandler;
}
export interface ISpawnmonOptions extends ProcessEnvOptions {
    writestream?: NodeJS.WritableStream;
    transform?: TransformHandler;
    prefix?: 'index' | 'command';
    prefixMax?: number;
    prefixDefaultColor?: Color;
    prefixTemplate?: string;
    prefixAlign?: 'left' | 'right' | 'center';
    prefixFill?: string;
    condensed?: boolean;
    handleSignals?: boolean;
    unformatted?: boolean;
    maxProcesses?: number;
}
export declare type PingerEvent = 'retry' | 'failed' | 'connected' | 'destroyed';
export declare type PingerHandler = (retries?: number, pinger?: Pinger) => void;
export interface IPinger {
    on(event: PingerEvent, handler: PingerHandler): void;
    off(event: PingerEvent, handler: PingerHandler): void;
}
export interface IPingerOptions extends SocketConstructorOpts {
    name?: string;
    host?: string;
    port?: number;
    attempts?: number;
    timeout?: number;
    onConnected?: PingerHandler;
}
export declare type SimpleTimerEvent = 'timeout' | 'condition' | 'update';
export declare type SimpleTimerHandler = (update: any, counters?: ISimpleTimerCounters, timer?: SimpleTimer) => void;
export interface ISimpleTimerOptions {
    name?: string;
    interval?: number;
    timeout?: number;
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
export declare type Color = keyof StylesType<StyleFunction>;
