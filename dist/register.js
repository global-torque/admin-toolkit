import { createDisclosure, createDismissible, createToastStack, } from './behaviors.js';
function nameWithPrefix(prefix, name) {
    return `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}
function asOptions(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : undefined;
}
function asToasts(value) {
    return Array.isArray(value) ? value : undefined;
}
export function registerAdminAlpine(alpine, { prefix = 'gt' } = {}) {
    alpine.data(nameWithPrefix(prefix, 'disclosure'), (options) => createDisclosure(asOptions(options)));
    alpine.data(nameWithPrefix(prefix, 'dismissible'), (options) => createDismissible(asOptions(options)));
    alpine.data(nameWithPrefix(prefix, 'toastStack'), (initialToasts) => createToastStack(asToasts(initialToasts)));
}
//# sourceMappingURL=register.js.map