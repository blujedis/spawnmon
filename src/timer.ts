
import EventEmitter from 'events';
import { ISimpleTimerOptions, SimpleTimerHandler, SimpleTimerEvent } from './types';

export declare interface SimpleTimer {
  on(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
  off(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
}

const TIMER_DEFAULTS: ISimpleTimerOptions = {
  active: true,  
  name: 'anonymous',
  interval: 1800, // ping at this interval on condition met.
  timeout: 20000 // after 20 seconds shut'er down to be safe, should be plenty.
};

export class SimpleTimer extends EventEmitter {

  private counter = 0;
  private previousCounter = 0;
  private startTime = 0;
  private endTime = 0;
  private timeoutId;
  private intervalId;
  private initialized = false;
  private lastUpdate: any;
  running = false;

  options: ISimpleTimerOptions;

  constructor(options?: ISimpleTimerOptions) {
    super();
    options = { ...TIMER_DEFAULTS, ...options };
    this.options = options;
    if (options.onCondition)
      this.on('condition', this.options.onCondition);
  }

  private initTimeout() {
    this.timeoutId = setTimeout(() => {
      this.emit('expired', this.lastUpdate, this.endTime - this.startTime, this);
      this.stop();
    }, this.options.timeout);
  }

  private testCondition(): boolean {
    if (this.options.onCondition)
      return this.options.condition(this.lastUpdate, this.counters, this);
    return this.initialized && this.counter === this.previousCounter;
  }

  private finished() {
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

  update(data: any) {
    this.initialized = true;
    this.counter += 1;
    this.lastUpdate = data;
    this.emit('updated', data, Date.now() - this.startTime, this);
  }

  start(onCondition?: SimpleTimerHandler) {
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