export declare type HelpConfigs = typeof configs;
export declare type HelpKey = keyof HelpConfigs;
export declare type HelpItem<K extends HelpKey> = HelpConfigs[K];
export declare type Help = {
    [K in HelpKey]: HelpConfigs[K];
};
export declare type HelpGroupKey = 'prefix' | 'misc' | 'styling' | 'process';
export interface IHelpItem {
    name: string;
    description: string;
    alias: string | string[];
    examples: string[];
    isFlag: boolean;
    help: undefined | string | string[];
    type: string;
    group: HelpGroupKey;
}
export interface IHelpItemGrouped<G extends HelpGroupKey> extends IHelpItem {
    group: G;
}
declare const configs: {
    templates: {
        logo: string;
        usage: string;
    };
    raw: IHelpItem;
    maxProcesses: IHelpItem;
    prefixAlign: IHelpItem;
    defaultColor: IHelpItem;
    condensed: IHelpItem;
    prefix: IHelpItem;
    prefixFill: IHelpItem;
    prefixMax: IHelpItem;
    labels: IHelpItem;
    version: IHelpItem;
    colors: IHelpItem;
};
export default configs;
