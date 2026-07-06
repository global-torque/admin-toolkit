export function createDisclosure({ initiallyOpen = false } = {}) {
    return {
        open: initiallyOpen,
        init() {
            this.open = Boolean(this.open);
        },
        show() {
            this.open = true;
        },
        hide() {
            this.open = false;
        },
        toggle() {
            this.open = !this.open;
        },
    };
}
export function createDismissible({ initiallyVisible = true } = {}) {
    return {
        visible: initiallyVisible,
        init() {
            this.visible = Boolean(this.visible);
        },
        dismiss() {
            this.visible = false;
        },
        restore() {
            this.visible = true;
        },
    };
}
export function createToastStack(initialToasts = []) {
    return {
        toasts: [...initialToasts],
        init() {
            this.toasts = [...this.toasts];
        },
        push(toast) {
            this.toasts.push(toast);
        },
        remove(id) {
            this.toasts = this.toasts.filter((toast) => toast.id !== id);
        },
        clear() {
            this.toasts = [];
        },
    };
}
//# sourceMappingURL=behaviors.js.map