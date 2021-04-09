/// <reference types="node" />
import EventEmitter from 'events';
import { ISimpleTimerOptions, SimpleTimerHandler, SimpleTimerEvent } from './types';
export declare interface SimpleTimer {
    on(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
    off(event: SimpleTimerEvent, handler: SimpleTimerHandler): this;
}
export declare class SimpleTimer extends EventEmitter {
    private counter;
    private previousCounter;
    private startTime;
    private endTime;
    private timeoutId;
    private intervalId;
    private initialized;
    private lastUpdate;
    running: boolean;
    options: ISimpleTimerOptions;
    constructor(options?: ISimpleTimerOptions);
    private initTimeout;
    private testCondition;
    private finished;
    get counters(): {
        counter: number;
        previousCounter: number;
        startTime: number;
        endTime: number;
        elasped: number;
    };
    activate(): void;
    inactivate(): void;
    update(data: any): void;
    start(onCondition?: SimpleTimerHandler): void;
    stop(): void;
}
