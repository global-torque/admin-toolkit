import type { AlpineLike, HtmxLike, HydrateOptions } from './types.js';

export function hydrate(root: Element | DocumentFragment, options: HydrateOptions = {}): boolean {
  if (!options.alpine?.initTree) {
    return false;
  }

  options.alpine.initTree(root);
  return true;
}

export function registerHtmxHydration(htmx: HtmxLike, alpine: Pick<AlpineLike, 'initTree'>) {
  htmx.onLoad((root) => {
    hydrate(root, { alpine });
  });
}
