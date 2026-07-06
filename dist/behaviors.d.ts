export interface DisclosureOptions {
    initiallyOpen?: boolean;
}
export declare function createDisclosure({ initiallyOpen }?: DisclosureOptions): {
    open: boolean;
    init(): void;
    show(): void;
    hide(): void;
    toggle(): void;
};
export interface DismissibleOptions {
    initiallyVisible?: boolean;
}
export declare function createDismissible({ initiallyVisible }?: DismissibleOptions): {
    visible: boolean;
    init(): void;
    dismiss(): void;
    restore(): void;
};
export interface ToastItem {
    id: string;
    tone?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    message: string;
}
export declare function createToastStack(initialToasts?: readonly ToastItem[]): {
    toasts: ToastItem[];
    init(): void;
    push(toast: ToastItem): void;
    remove(id: string): void;
    clear(): void;
};
//# sourceMappingURL=behaviors.d.ts.map