export declare type HelpConfigs = Omit<typeof configs, 'templates'> & {
    templates?: typeof configs.templates;
};
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
    default?: string | number | boolean | (string | number | boolean)[];
    coerce?: (...args: any[]) => any;
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
    delay: IHelpItem;
    mute: IHelpItem;
    onTimer: IHelpItem;
    onPinger: IHelpItem;
};
export default configs;
