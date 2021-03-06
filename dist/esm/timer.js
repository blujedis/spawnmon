import EventEmitter from 'events';
import { ensureDefaults } from './utils';
const TIMER_DEFAULTS = {
    active: true,
    name: 'anonymous',
    interval: 1800,
    timeout: 20000 // after 20 seconds shut'er down to be safe, should be plenty.
};
export class SimpleTimer extends EventEmitter {
    constructor(options) {
        super();
        this.counter = 0;
        this.previousCounter = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.initialized = false;
        this.running = false;
        options = ensureDefaults(options, TIMER_DEFAULTS);
        this.options = options;
        if (options.onCondition)
            this.on('condition', this.options.onCondition);
    }
    initTimeout() {
        this.timeoutId = setTimeout(() => {
            this.emit('expired', this.lastUpdate, this.endTime - this.startTime, this);
            this.stop();
        }, this.options.timeout);
    }
    testCondition() {
        if (this.options.onCondition)
            return this.options.condition(this.lastUpdate, this.counters, this);
        return this.initialized && this.counter === this.previousCounter;
    }
    finished() {
        this.endTime = Date.now();
        this.emit('condition', this.lastUpdate, this.counters, this);
        this.stop();
    }
    get counters() {
        return {
            counter: this.counter,
            previousCounter: this.previousCounter,
            startTime: this.startTime,
            endTime: this.endTime,
            elasped: this.endTime - this.startTime
        };
    }
    enable() {
        this.options.active = true;
    }
    disable() {
        this.options.active = false;
    }
    update(data) {
        this.initialized = true;
        this.counter += 1;
        this.lastUpdate = data;
        this.emit('updated', data, Date.now() - this.startTime, this);
    }
    start(onCondition) {
        if (this.running || !this.options.active)
            return;
        if (onCondition)
            this.on('condition', onCondition);
        this.startTime = Date.now();
        this.running = true;
        this.initTimeout();
        this.intervalId = setInterval(() => {
            if (this.testCondition())
                return this.finished();
            this.previousCounter = this.counter;
        }, this.options.interval);
    }
    stop() {
        clearInterval(this.intervalId);
        clearInterval(this.timeoutId);
        this.counter = 0;
        this.previousCounter = 0;
        this.running = false;
        this.initialized = false;
        this.lastUpdate = undefined;
    }
}
//# sourceMappingURL=timer.js.map