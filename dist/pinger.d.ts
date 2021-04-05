/// <reference types="node" />
import { Socket, SocketConstructorOpts } from 'net';
import { PingDispatchEvent } from './types';
/**
 * Creates a socket and pings until connected specified tries are exhausted.
 *
 * @param host the host ping.
 * @param port the port to ping if any.
 * @param cb a callback on connected.
 */
declare function pinger(port?: number, host?: string): {
    readonly tries: number;
    readonly retries: number;
    readonly client: Socket;
    readonly events: {
        retry: any[];
        retried: any[];
        connected: any[];
        destroyed: any[];
    };
    destroy: () => void;
    on: (event: PingDispatchEvent, handler: (tries?: number, client?: Socket) => void) => any;
    connect: (options?: SocketConstructorOpts & {
        retries?: number;
        delay?: number;
    }) => Promise<void>;
};
export default pinger;
