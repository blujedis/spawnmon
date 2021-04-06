"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pinger = void 0;
const net_1 = require("net");
class Pinger {
    constructor(portOrOptions, host, socketOptions) {
        this._events = {
            retry: [],
            failed: [],
            connected: [],
            destroyed: []
        };
        this.retries = 0;
        let options = portOrOptions;
        if (typeof portOrOptions === 'number') {
            options = {
                port: portOrOptions,
                host: host,
                attempts: 10,
                delay: 1800,
                ...socketOptions
            };
        }
        this.options = { port: 3000, host: '127.0.0.1', ...options };
    }
    dispatch(event) {
        if (this._events[event].length)
            this._events[event].forEach(handler => handler(this.retries, this));
    }
    get host() {
        return this.options.host;
    }
    get port() {
        return this.options.port;
    }
    on(event, handler) {
        this._events[event].push(handler);
        return this;
    }
    off(event, handler) {
        const events = this._events[event];
        this._events[event] = events[event].splice(events[event].indexOf(handler), 1);
        return this;
    }
    retry() {
        this.retries += 1;
        this.dispatch('retry');
        this.socket.connect(this.port, this.host, () => {
            this.socket.end();
            this.dispatch('connected');
        });
    }
    start() {
        this.socket = new net_1.Socket(this.options);
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
exports.Pinger = Pinger;
//# sourceMappingURL=pinger.js.map