import { StylesType, StyleFunction } from 'ansi-colors';
import { SpawnOptions, ChildProcess, SpawnSyncOptions, SpawnSyncReturns } from 'child_process';
import { ApiBase } from './runner';

export { ApiBase };

export type ApiFor = Omit<ApiBase, 'run' | 'kill'> &
{
  readonly options?: {
    child?: ChildProcess | SpawnSyncReturns<Buffer>;
    transform?: TransformHandler;
    command?: CommandTuple;
    delay?: number;
  }
  child: () => ChildProcess;
  transform: (handler: TransformHandler) => ApiFor;
  delay: (delay?: number) => ApiFor;
  run: (transform?: TransformHandler) => ApiFor;
  kill: () => void;
};


export type PingDispatchEvent = 'retry' | 'retried' | 'connected' | 'destroyed';

export type Color = keyof StylesType<StyleFunction>;

export interface SpawnOptionsExt extends SpawnOptions {
  writestream?: 'stdout' | 'stderr'; // default stdout
}

export interface SpawnOptionsSyncExt extends SpawnSyncOptions {
  writestream?: 'stdout' | 'stderr'; // default stdout
}

export type TransformHandler = (chunk: string) => void;

export type CommandTuple = [string, string[]?, SpawnOptionsExt?, TransformHandler?];
