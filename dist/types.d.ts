export type AlpineDataFactory<TState extends object = object> = (...params: unknown[]) => TState;
export interface AlpineLike {
    data(name: string, factory: AlpineDataFactory): void;
    initTree?: (root: Element | DocumentFragment) => void;
}
export interface HtmxLike {
    onLoad(callback: (root: Element) => void): void;
}
export interface AdminAlpineRegistrationOptions {
    prefix?: string;
}
export interface HydrateOptions {
    alpine?: Pick<AlpineLike, 'initTree'>;
}
//# sourceMappingURL=types.d.ts.map