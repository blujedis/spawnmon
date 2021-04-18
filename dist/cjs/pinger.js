"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pinger = void 0;
const net_1 = require("net");
const events_1 = require("events");
const utils_1 = require("./utils");
const PINGER_DEFAULTS = {
    active: true,
    host: '127.0.0.1',
    port: 3000,
    attempts: 25,
    timeout: 1800,
    autoStop: true
};
class Pinger extends events_1.EventEmitter {
    constructor(portOrOptions, host, socketOptions) {
        super();
        this.retries = 0;
        this.connected = false;
        let options = portOrOptions;
        if (typeof portOrOptions === 'number') {
            options = {
                port: portOrOptions,
                host: host,
                ...socketOptions
            };
        }
        this.options = utils_1.ensureDefaults(options, PINGER_DEFAULTS);
        if (this.options.onConnected)
            this.on('connected', this.options.onConnected);
    }
    dispatch(event) {
        this.emit(event, this.retries, this);
    }
    retry() {
        if (this.connected)
            return;
        this.retries += 1;
        this.dispatch('retry');
        this.socket.connect(this.port, this.host, () => {
            this.socket.end();
            this.finished();
            this.connected = true;
        });
    }
    reset() {
        clearTimeout(this.timeoutId);
        this.disable();
        this.connected = false;
        this.retries = 0;
    }
    finished() {
        if (this.connected)
            return;
        this.dispatch('connected');
        this.reset();
    }
    get host() {
        return this.options.host;
    }
    get port() {
        return this.options.port;
    }
    enable() {
        this.options.active = true;
    }
    disable() {
        this.options.active = false;
    }
    start(onConnected) {
        if (!this.enable)
            return this;
        if (this.socket)
            return this;
        if (onConnected)
            this.on('connected', onConnected);
        this.socket = new net_1.Socket(this.options);
        this.socket.on('error', (_) => {
            if (this.connected)
                return;
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
exports.Pinger = Pinger;
//# sourceMappingURL=pinger.js.map