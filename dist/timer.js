"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleTimer = void 0;
const events_1 = __importDefault(require("events"));
const TIMER_DEFAULTS = {
    name: 'anonymous',
    interval: 2500,
    timeout: 15000 // after 15 seconds shut'er down.
};
class SimpleTimer extends events_1.default {
    constructor(options) {
        super();
        this.ctr = 0;
        this.prevCtr = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.initialized = false;
        this.running = false;
        options = { ...TIMER_DEFAULTS, ...options };
        this.options = options;
        if (options.onCondition)
            this.on('condition', this.options.onCondition);
    }
    initTimeout() {
        this.timeoutId = setTimeout(() => {
            stop();
            this.emit('expired', this.endTime - this.startTime, this);
        }, this.options.timeout);
    }
    testCondition() {
        const previous = this.prevCtr;
        const current = this.ctr;
        if (this.options.onCondition)
            return this.options.condition(previous, current, this.intervalId);
        return this.initialized && current === previous;
    }
    finished() {
        this.emit('finished', this.endTime - this.startTime, this);
        this.stop();
    }
    update() {
        this.initialized = true;
        this.ctr += 1;
        this.emit('updated', Date.now() - this.startTime, this);
    }
    start(onCondition) {
        if (this.running)
            return; // already running stop first.
        if (this.intervalId)
            clearInterval(this.intervalId);
        if (onCondition)
            this.on('condition', onCondition);
        this.startTime = Date.now();
        this.running = true;
        this.initTimeout();
        this.intervalId = setInterval(() => {
            if (this.testCondition())
                return this.finished();
            this.prevCtr = this.ctr;
        }, this.options.interval);
    }
    stop() {
        clearInterval(this.intervalId);
        clearInterval(this.timeoutId);
        this.ctr = 0;
        this.prevCtr = 0;
        this.running = false;
        this.initialized = false;
    }
}
exports.SimpleTimer = SimpleTimer;
//# sourceMappingURL=timer.js.map