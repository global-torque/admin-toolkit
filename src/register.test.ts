import { describe, expect, it } from 'vitest';

import {
  createDisclosure,
  hydrate,
  registerAdminAlpine,
  registerHtmxHydration,
} from './index';
import type { AlpineDataFactory, AlpineLike, HtmxLike } from './types';

describe('admin-toolkit Alpine helpers', () => {
  it('registers prefixed data providers', () => {
    const registered = new Map<string, AlpineDataFactory>();
    const alpine: AlpineLike = {
      data(name, factory) {
        registered.set(name, factory);
      },
    };

    registerAdminAlpine(alpine);

    expect([...registered.keys()]).toEqual([
      'gtDisclosure',
      'gtDismissible',
      'gtToastStack',
    ]);
  });

  it('creates parameterized disclosure state with an init hook', () => {
    const disclosure = createDisclosure({ initiallyOpen: true });

    disclosure.init();
    disclosure.toggle();

    expect(disclosure.open).toBe(false);
  });

  it('hydrates inserted fragments through an injected Alpine instance', () => {
    let hydratedRoot: Element | DocumentFragment | null = null;
    const root = { nodeType: 11 } as DocumentFragment;

    const result = hydrate(root, {
      alpine: {
        initTree(nextRoot) {
          hydratedRoot = nextRoot;
        },
      },
    });

    expect(result).toBe(true);
    expect(hydratedRoot).toBe(root);
  });

  it('registers an htmx onLoad hydration hook', () => {
    const callbacks: Array<(root: Element) => void> = [];
    let hydratedRoot: Element | null = null;
    const htmx: HtmxLike = {
      onLoad(nextCallback) {
        callbacks.push(nextCallback);
      },
    };
    const root = { nodeType: 1 } as Element;

    registerHtmxHydration(htmx, {
      initTree(nextRoot) {
        hydratedRoot = nextRoot as Element;
      },
    });
    expect(callbacks).toHaveLength(1);
    callbacks[0]!(root);

    expect(hydratedRoot).toBe(root);
  });
});
