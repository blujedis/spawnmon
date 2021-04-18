/// <reference types="node" />
import { SpawnOptions, ProcessEnvOptions } from 'child_process';
import { SocketConstructorOpts } from 'net';
import { Command } from './command';
import { Pinger } from './pinger';
import { SimpleTimer } from './timer';
export declare type EventSubscriptionType = 'stdout' | 'stderr' | 'error' | 'close';
export declare type PrefixKey = 'index' | 'pid' | 'command' | 'timestamp';
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
    group?: string | string[];
    index?: number;
    args?: string[];
    transform?: TransformHandler;
    color?: string;
    mute?: boolean;
    condensed?: boolean;
    delay?: number;
    pinger?: IPingerOptions | PingerHandler;
    timer?: ISimpleTimerOptions | SimpleTimerHandler;
    runnable?: boolean;
    outputExitCode?: boolean;
}
export interface ICommandOptionsExt extends ICommandOptions {
    command: string;
    args: any[];
    index: number;
    groupIndex: number;
    groupIndexLast: number;
    isGroup: boolean;
    timer: ISimpleTimerOptions;
    pinger: IPingerOptions;
}
export interface ISpawnmonOptions extends ProcessEnvOptions {
    writestream?: NodeJS.WritableStream;
    transform?: TransformHandler;
    prefix?: string;
    prefixMax?: number;
    prefixAlign?: 'left' | 'right' | 'center';
    prefixFill?: string;
    defaultColor?: Color;
    condensed?: boolean;
    handleSignals?: boolean;
    raw?: boolean;
    maxProcesses?: number;
    pipeInput?: string | Command;
    outputExitCode?: boolean;
    sendEnter?: boolean;
    onTimestamp?: () => string;
}
export declare type PingerEvent = 'retry' | 'failed' | 'connected' | 'destroyed';
export declare type PingerHandler = (retries?: number, pinger?: Pinger) => void;
export interface IPinger {
    on(event: PingerEvent, handler: PingerHandler): void;
    off(event: PingerEvent, handler: PingerHandler): void;
}
export interface IPingerOptions extends SocketConstructorOpts {
    active?: boolean;
    name?: string;
    target?: string;
    host?: string;
    port?: number;
    attempts?: number;
    timeout?: number;
    onConnected?: PingerHandler;
    autoStop?: boolean;
}
export declare type SimpleTimerEvent = 'timeout' | 'condition' | 'update';
export declare type SimpleTimerHandler = (update: any, counters?: ISimpleTimerCounters, timer?: SimpleTimer) => void;
export interface ISimpleTimerOptions {
    active?: boolean;
    name?: string;
    target?: string;
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
export declare type Color = string;
