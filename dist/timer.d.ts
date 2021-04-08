/// <reference types="node" />
import EventEmitter from 'events';
import { ISimpleTimerOptions, SimpleTimerHandler, SimpleTimerEvent } from './types';
export declare interface SimpleTimer {
    on(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
    off(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
}
export declare class SimpleTimer extends EventEmitter {
    private ctr;
    private prevCtr;
    private startTime;
    private endTime;
    private timeoutId;
    private intervalId;
    private initialized;
    running: boolean;
    options: ISimpleTimerOptions;
    constructor(options: ISimpleTimerOptions);
    private initTimeout;
    private testCondition;
    private finished;
    update(): void;
    start(onCondition?: SimpleTimerHandler): void;
    stop(): void;
}
