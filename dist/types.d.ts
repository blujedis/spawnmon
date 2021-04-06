/// <reference types="node" />
import { SpawnOptions, ProcessEnvOptions } from 'child_process';
import { StylesType, StyleFunction } from 'ansi-colors';
import { SocketConstructorOpts } from 'net';
import { Pinger } from './pinger';
export declare type TransformHandler = (line: string | Buffer, command?: string, from?: 'stdout' | 'stderr') => string;
export interface ICommandOptions extends SpawnOptions {
    command: string;
    args?: any[];
    transform?: TransformHandler;
    prefix?: string;
    color?: Color;
    mute?: boolean;
}
export interface ISpawnmonOptions extends ProcessEnvOptions {
    writestream?: NodeJS.WritableStream;
    transform?: TransformHandler;
}
export declare type PingerEvent = keyof IPingerEvents;
export declare type PingerHandler = (retries?: number, pinger?: Pinger) => void;
export interface IPingerOptions extends SocketConstructorOpts {
    host?: string;
    port?: number;
    attempts?: number;
    delay?: number;
}
export interface IPingerEvents {
    connected: PingerHandler[];
    retry: PingerHandler[];
    failed: PingerHandler[];
    destroyed: PingerHandler[];
}
export declare type Color = keyof StylesType<StyleFunction>;
