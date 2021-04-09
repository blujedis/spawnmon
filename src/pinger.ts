import { Socket, SocketConstructorOpts } from 'net';
import { EventEmitter } from 'events';
import { PingerEvent, IPingerOptions, PingerHandler } from './types';

const PINGER_DEFAULTS: IPingerOptions = {
  active: true,
  host: '127.0.0.1',
  port: 3000,
  attempts: 10,
  timeout: 1800
};

export declare interface Pinger {
  on(event: PingerEvent, handler: PingerHandler): this;
  off(event: PingerEvent, handler: PingerHandler): this;
}

export class Pinger extends EventEmitter {

  private timeoutId: NodeJS.Timeout;

  retries = 0;
  socket: Socket;
  connected = false;

  options: IPingerOptions;

  constructor(portOrOptions?: number | IPingerOptions, host?: string, socketOptions?: SocketConstructorOpts) {

    super();

    let options = portOrOptions as IPingerOptions;

    if (typeof portOrOptions === 'number') {
      options = {
        port: portOrOptions as number,
        host: host,
        ...socketOptions
      };
    }

    this.options = { ...PINGER_DEFAULTS, ...options };

    if (this.options.onConnected)
      this.on('connected', this.options.onConnected);

  }

  private dispatch(event: PingerEvent) {
    this.emit(event, this.retries, this);
  }

  private retry() {
    if (this.connected) return;
    this.retries += 1;
    this.dispatch('retry');
    this.socket.connect(this.port, this.host, () => {
      this.socket.end();
      this.finished();
      this.connected = true;
    });
  }

  private reset() {
    clearTimeout(this.timeoutId);
    this.connected = false;
    this.retries = 0;
    this.connected = false;
  }

  private finished() {
    if (this.connected) return;
    this.dispatch('connected');
    this.reset();
  }

  get host() {
    return this.options.host;
  }

  get port() {
    return this.options.port;
  }

  activate() {
    this.options.active = true;
  }

  inactivate() {
    this.options.active = false;
  }

  start(onConnected?: (retries?: number, pinger?: Pinger) => void) {

    if (!this.activate) return this;

    if (this.socket) return this;

    if (onConnected)
      this.on('connected', onConnected);

    this.socket = new Socket(this.options);

    this.socket.on('error', (_) => {
      if (this.connected) return;
      clearTimeout(this.timeoutId);
      this.dispatch('failed');
      if (this.retries === this.options.attempts)
        return this.destroy();
      this.timeoutId = setTimeout(() => this.retry(), this.options.timeout);
    });

    this.retry();

    return this;

  }

  stop() {
    this.reset();
  }

  destroy() {
    this.dispatch('destroyed');
    this.reset();
    this.socket && this.socket.destroy();
  }

}