export declare type HelpConfigs = typeof configs;
export declare type HelpKey = keyof HelpConfigs;
export declare type HelpItem<K extends HelpKey> = HelpConfigs[K];
export declare type Help = {
    [K in HelpKey]: HelpConfigs[K];
};
export declare type HelpGroupKey = 'spawnmon' | 'command' | 'misc';
export interface IHelpItem {
    name: string;
    description: string;
    alias: string | string[];
    examples: string[];
    isFlag: boolean;
    help: undefined | string | string[];
    type: string;
    group: HelpGroupKey;
    default?: string | number | boolean | (string | number | boolean)[];
    coerce?: (...args: any[]) => any;
}
export interface IHelpItemGrouped<G extends HelpGroupKey> extends IHelpItem {
    group: G;
}
export declare type TransformHandler = (val: any, ...args: any[]) => any;
export declare const usage = "usage: {app} [options] <commands...>";
export declare const configs: {
    raw: IHelpItem;
    maxProcesses: IHelpItem;
    prefixAlign: IHelpItem;
    defaultColor: IHelpItem;
    condensed: IHelpItem;
    prefix: IHelpItem;
    prefixFill: IHelpItem;
    prefixMax: IHelpItem;
    version: IHelpItem;
    pipeInput: IHelpItem;
    sendEnter: IHelpItem;
    group: IHelpItem;
    color: IHelpItem;
    delay: IHelpItem;
    mute: IHelpItem;
    onTimeout: IHelpItem;
    onConnect: IHelpItem;
    onConnectAddress: IHelpItem;
};
