export interface DisclosureOptions {
  initiallyOpen?: boolean;
}

export function createDisclosure({ initiallyOpen = false }: DisclosureOptions = {}) {
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

export interface DismissibleOptions {
  initiallyVisible?: boolean;
}

export function createDismissible({ initiallyVisible = true }: DismissibleOptions = {}) {
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

export interface ToastItem {
  id: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  message: string;
}

export function createToastStack(initialToasts: readonly ToastItem[] = []) {
  return {
    toasts: [...initialToasts],
    init() {
      this.toasts = [...this.toasts];
    },
    push(toast: ToastItem) {
      this.toasts.push(toast);
    },
    remove(id: string) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    },
    clear() {
      this.toasts = [];
    },
  };
}
