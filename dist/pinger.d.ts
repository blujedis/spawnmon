/// <reference types="node" />
import { Socket, SocketConstructorOpts } from 'net';
import { PingerEvent, IPingerOptions, PingerHandler } from './types';
export declare class Pinger {
    private _events;
    retries: number;
    socket: Socket;
    options: IPingerOptions;
    constructor(portOrOptions?: number | IPingerOptions, host?: string, socketOptions?: SocketConstructorOpts);
    private dispatch;
    get host(): string;
    get port(): number;
    on(event: PingerEvent, handler: PingerHandler): this;
    off(event: PingerEvent, handler: PingerHandler): this;
    private retry;
    start(): this;
    destroy(): void;
}
