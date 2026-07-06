import {
  createDisclosure,
  createDismissible,
  createToastStack,
  type DismissibleOptions,
  type DisclosureOptions,
  type ToastItem,
} from './behaviors.js';
import type { AdminAlpineRegistrationOptions, AlpineLike } from './types.js';

function nameWithPrefix(prefix: string, name: string) {
  return `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function asOptions<TOptions extends object>(value: unknown): TOptions | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as TOptions
    : undefined;
}

function asToasts(value: unknown): readonly ToastItem[] | undefined {
  return Array.isArray(value) ? value as ToastItem[] : undefined;
}

export function registerAdminAlpine(
  alpine: AlpineLike,
  { prefix = 'gt' }: AdminAlpineRegistrationOptions = {},
) {
  alpine.data(
    nameWithPrefix(prefix, 'disclosure'),
    (options) => createDisclosure(asOptions<DisclosureOptions>(options)),
  );
  alpine.data(
    nameWithPrefix(prefix, 'dismissible'),
    (options) => createDismissible(asOptions<DismissibleOptions>(options)),
  );
  alpine.data(
    nameWithPrefix(prefix, 'toastStack'),
    (initialToasts) => createToastStack(asToasts(initialToasts)),
  );
}
