import type {
  AdminHydrator,
  AlpineLike,
  HtmxHydrationOptions,
  HtmxLike,
} from './types.js';

interface HtmxInstallation {
  readonly force: boolean;
  readonly listener: EventListener;
  references: number;
}

const htmxInstallations = new WeakMap<
  HtmxLike,
  WeakMap<object, HtmxInstallation>
>();

/**
 * Create repeat-safe hydration state scoped to one Alpine instance.
 *
 * @throws `TypeError` when Alpine has no `initTree` method or hydration receives
 * anything other than a real DOM Element.
 * @public
 */
export function createAdminHydrator(
  alpine: Pick<AlpineLike, 'destroyTree' | 'initTree'>,
): AdminHydrator {
  if (!alpine || typeof alpine.initTree !== 'function') {
    throw new TypeError('Alpine initTree() is required for hydration.');
  }
  const initTree = alpine.initTree.bind(alpine);
  const hydrated = new WeakSet<Element>();
  return {
    hydrate(root, { force = false } = {}) {
      const ElementConstructor = root?.ownerDocument?.defaultView?.Element;
      if (!ElementConstructor || !(root instanceof ElementConstructor)) {
        throw new TypeError('Hydration requires an Element root.');
      }
      const alreadyHydrated = hydrated.has(root);
      if (alreadyHydrated && !force) return false;
      if (force && typeof alpine.destroyTree === 'function') {
        alpine.destroyTree(root);
      }
      initTree(root);
      hydrated.add(root);
      return true;
    },
    forget(root) {
      return hydrated.delete(root);
    },
  };
}

/**
 * Install htmx fragment hydration and return an idempotent unsubscribe hook.
 * The listener supplied by htmx `onLoad()` is removed through `off()`.
 * Duplicate installations for the same htmx/Alpine pair share one listener and
 * release it after the final subscriber unsubscribes.
 *
 * @throws `TypeError` for incomplete libraries, non-removable listeners, or
 * conflicting `force` options on a shared installation.
 * @public
 */
export function installHtmxHydration(
  htmx: HtmxLike,
  alpine: Pick<AlpineLike, 'destroyTree' | 'initTree'>,
  { force = false }: HtmxHydrationOptions = {},
): () => void {
  if (
    !htmx ||
    typeof htmx.onLoad !== 'function' ||
    typeof htmx.off !== 'function'
  ) {
    throw new TypeError('htmx onLoad() and off() are required.');
  }
  if (!alpine || typeof alpine !== 'object') {
    throw new TypeError('An Alpine instance is required for hydration.');
  }
  const alpineKey = alpine as object;
  const byAlpine = htmxInstallations.get(htmx) ?? new WeakMap();
  const existing = byAlpine.get(alpineKey);
  if (existing) {
    if (existing.force !== force) {
      throw new TypeError(
        'The same htmx and Alpine instances cannot use conflicting force options.',
      );
    }
    existing.references += 1;
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      existing.references -= 1;
      if (existing.references === 0) {
        byAlpine.delete(alpineKey);
        htmx.off('htmx:load', existing.listener);
      }
    };
  }
  const hydrator = createAdminHydrator(alpine);
  const callback = (root: Node) => {
    if (
      root.nodeType !== 1 ||
      typeof (root as Element).querySelectorAll !== 'function'
    ) {
      throw new TypeError('htmx onLoad() must provide an Element root.');
    }
    hydrator.hydrate(root as Element, { force });
  };
  const registeredListener = htmx.onLoad(callback);
  if (typeof registeredListener !== 'function') {
    htmx.off('htmx:load', callback as unknown as EventListener);
    throw new TypeError('htmx onLoad() must return its removable listener.');
  }
  const listener = registeredListener;
  const installation: HtmxInstallation = {
    force,
    listener,
    references: 1,
  };
  byAlpine.set(alpineKey, installation);
  htmxInstallations.set(htmx, byAlpine);
  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    installation.references -= 1;
    if (installation.references === 0) {
      byAlpine.delete(alpineKey);
      htmx.off('htmx:load', listener);
    }
  };
}
