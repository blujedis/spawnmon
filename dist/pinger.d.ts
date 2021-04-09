/// <reference types="node" />
import { Socket, SocketConstructorOpts } from 'net';
import { EventEmitter } from 'events';
import { PingerEvent, IPingerOptions, PingerHandler } from './types';
export declare interface Pinger {
    on(event: PingerEvent, handler: PingerHandler): this;
    off(event: PingerEvent, handler: PingerHandler): this;
}
export declare class Pinger extends EventEmitter {
    private timeoutId;
    retries: number;
    socket: Socket;
    connected: boolean;
    options: IPingerOptions;
    constructor(portOrOptions?: number | IPingerOptions, host?: string, socketOptions?: SocketConstructorOpts);
    private dispatch;
    private retry;
    private reset;
    private finished;
    get host(): string;
    get port(): number;
    activate(): void;
    inactivate(): void;
    start(onConnected?: (retries?: number, pinger?: Pinger) => void): this;
    stop(): void;
    destroy(): void;
}
