import { Socket, SocketConstructorOpts } from 'net';
import { PingerEvent, IPingerOptions, IPingerEvents, PingerHandler } from './types';

export class Pinger {

  private _events: IPingerEvents = {
    retry: [],
    failed: [],
    connected: [],
    destroyed: []
  };

  retries = 0;
  socket: Socket;

  options: IPingerOptions;

  constructor(portOrOptions?: number | IPingerOptions, host?: string, socketOptions?: SocketConstructorOpts) {

    let options = portOrOptions as IPingerOptions;

    if (typeof portOrOptions === 'number') {
      options = {
        port: portOrOptions as number,
        host: host,
        attempts: 10,
        delay: 1800,
        ...socketOptions
      };
    }

    this.options = { port: 3000, host: '127.0.0.1', ...options };

  }

  private dispatch(event: PingerEvent) {
    if (this._events[event].length)
      this._events[event].forEach(handler => handler(this.retries, this));
  }

  get host() {
    return this.options.host;
  }

  get port() {
    return this.options.port;
  }

  on(event: PingerEvent, handler: PingerHandler) {
    this._events[event].push(handler);
    return this;
  }

  off(event: PingerEvent, handler: PingerHandler) {
    const events = this._events[event];
    this._events[event] = events[event].splice(events[event].indexOf(handler), 1);
    return this;
  }

  private retry() {
    this.retries += 1;
    this.dispatch('retry');
    this.socket.connect(this.port, this.host, () => {
      this.socket.end();
      this.dispatch('connected');
    });
  }

  start() {

    this.socket = new Socket(this.options);

    this.socket.on('error', (_) => {
      this.dispatch('failed');
      if (this.retries === this.options.attempts)
        return this.destroy();
      setTimeout(this.retry.bind(this), this.options.delay);
    });

    return this;

  }

  destroy() {
    this.retries = 0;
    if (this.socket)
      this.socket.destroy();
  }

}