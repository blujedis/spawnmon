/// <reference types="node" />
import { StylesType, StyleFunction } from 'ansi-colors';
import { SpawnOptions, ChildProcess, SpawnSyncOptions, SpawnSyncReturns } from 'child_process';
import { ApiBase } from './runner';
export { ApiBase };
export declare type ApiFor = Omit<ApiBase, 'run' | 'kill'> & {
    readonly options?: {
        child?: ChildProcess | SpawnSyncReturns<Buffer>;
        transform?: TransformHandler;
        command?: CommandTuple;
        delay?: number;
    };
    child: () => ChildProcess;
    transform: (handler: TransformHandler) => ApiFor;
    delay: (delay?: number) => ApiFor;
    run: (transform?: TransformHandler) => ApiFor;
    kill: () => void;
};
export declare type PingDispatchEvent = 'retry' | 'retried' | 'connected' | 'destroyed';
export declare type Color = keyof StylesType<StyleFunction>;
export interface SpawnOptionsExt extends SpawnOptions {
    writestream?: 'stdout' | 'stderr';
}
export interface SpawnOptionsSyncExt extends SpawnSyncOptions {
    writestream?: 'stdout' | 'stderr';
}
export declare type TransformHandler = (chunk: string) => void;
export declare type CommandTuple = [string, string[]?, SpawnOptionsExt?, TransformHandler?];
