
import EventEmitter from 'events';
import { ISimpleTimerOptions, SimpleTimerHandler, SimpleTimerEvent } from './types';

export declare interface SimpleTimer {
  on(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
  off(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
}

const TIMER_DEFAULTS: ISimpleTimerOptions = {
  name: 'anonymous',
  interval: 2500, // ping every 2.5 seconds check update ctr has changed.
  timeout: 15000 // after 15 seconds shut'er down.
};

export class SimpleTimer extends EventEmitter {

  private ctr = 0;
  private prevCtr = 0;
  private startTime = 0;
  private endTime = 0;
  private timeoutId;
  private intervalId;
  private initialized = false;
  running = false;

  options: ISimpleTimerOptions;

  constructor(options: ISimpleTimerOptions) {
    super();
    options = { ...TIMER_DEFAULTS, ...options };
    this.options = options;
    if (options.onCondition) 
      this.on('condition', this.options.onCondition);
  }

  private initTimeout() {
    this.timeoutId = setTimeout(() => {
      stop();
      this.emit('expired', this.endTime - this.startTime, this);
    }, this.options.timeout);
  }

  private testCondition(): boolean {
    const previous = this.prevCtr;
    const current = this.ctr;
    if (this.options.onCondition)
      return this.options.condition(previous, current, this.intervalId);
    return this.initialized && current === previous;
  }

  private finished() {
    this.emit('finished', this.endTime - this.startTime, this);
    this.stop();
  }

  update() {
    this.initialized = true;
    this.ctr += 1;
    this.emit('updated', Date.now() - this.startTime, this);
  }

  start(onCondition?: SimpleTimerHandler) {
    if (this.running) return; // already running stop first.
    if (this.intervalId) clearInterval(this.intervalId);
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