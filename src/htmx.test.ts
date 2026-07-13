import { describe, expect, it, vi } from 'vitest';

import { createAdminHydrator, installHtmxHydration } from './htmx.js';
import type { HtmxLike } from './types.js';

describe('htmx Alpine hydration', () => {
  it('hydrates once, supports force, and can forget roots', () => {
    const initTree = vi.fn();
    const destroyTree = vi.fn();
    const hydrator = createAdminHydrator({ initTree, destroyTree });
    const root = document.createElement('section');
    const freshForcedRoot = document.createElement('article');
    expect(hydrator.hydrate(freshForcedRoot, { force: true })).toBe(true);
    expect(destroyTree).toHaveBeenCalledWith(freshForcedRoot);
    expect(hydrator.hydrate(root)).toBe(true);
    expect(hydrator.hydrate(root)).toBe(false);
    expect(hydrator.hydrate(root, { force: true })).toBe(true);
    expect(initTree).toHaveBeenCalledTimes(3);
    expect(destroyTree).toHaveBeenCalledWith(root);
    expect(hydrator.forget(root)).toBe(true);
    expect(hydrator.forget(root)).toBe(false);
    expect(() => createAdminHydrator({})).toThrow(/initTree/u);
    expect(() => hydrator.hydrate(null as never)).toThrow(/Element/u);
    expect(() =>
      hydrator.hydrate({ querySelectorAll: vi.fn() } as never),
    ).toThrow(/Element/u);
  });

  it('uses the exact onLoad listener for idempotent off cleanup', () => {
    let callback: ((root: Node) => void) | undefined;
    const registered = vi.fn<EventListener>();
    const off = vi.fn();
    const fakeHtmx: HtmxLike = {
      onLoad(next) {
        callback = next;
        return registered;
      },
      off,
    };
    const initTree = vi.fn();
    const alpine = { initTree };
    const unsubscribe = installHtmxHydration(fakeHtmx, alpine);
    const unsubscribeDuplicate = installHtmxHydration(fakeHtmx, alpine);
    const root = document.createElement('section');
    callback?.(root);
    callback?.(root);
    expect(initTree).toHaveBeenCalledTimes(1);
    unsubscribe();
    unsubscribe();
    expect(off).not.toHaveBeenCalled();
    unsubscribeDuplicate();
    unsubscribeDuplicate();
    expect(off).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledWith('htmx:load', registered);
    expect(() =>
      installHtmxHydration(fakeHtmx, alpine, { force: true }),
    ).not.toThrow();
  });

  it('integrates with real htmx 2.0 onLoad/off events', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- invoked with the XPath expression as the explicit receiver below.
    const nativeEvaluate = XPathExpression.prototype.evaluate;
    XPathExpression.prototype.evaluate = function evaluate(
      contextNode: Node,
      type = XPathResult.ANY_TYPE,
      result: XPathResult | null = null,
    ) {
      return nativeEvaluate.call(this, contextNode, type, result);
    };
    const { default: htmx } = await import('htmx.org');
    const initTree = vi.fn();
    const alpine = { initTree };
    const unsubscribe = installHtmxHydration(
      htmx as unknown as HtmxLike,
      alpine,
    );
    const unsubscribeDuplicate = installHtmxHydration(
      htmx as unknown as HtmxLike,
      alpine,
    );
    await Promise.resolve();
    const root = document.createElement('article');
    document.body.dispatchEvent(
      new CustomEvent('htmx:load', {
        bubbles: true,
        detail: { elt: root },
      }),
    );
    expect(initTree).toHaveBeenCalledWith(root);
    unsubscribe();
    unsubscribeDuplicate();
    document.body.dispatchEvent(
      new CustomEvent('htmx:load', {
        bubbles: true,
        detail: { elt: document.createElement('aside') },
      }),
    );
    expect(initTree).toHaveBeenCalledTimes(1);
  });

  it('rejects incomplete htmx instances', () => {
    expect(() =>
      installHtmxHydration({ onLoad: vi.fn() } as unknown as HtmxLike, {
        initTree: vi.fn(),
      }),
    ).toThrow(/onLoad.*off/u);
    const off = vi.fn();
    expect(() =>
      installHtmxHydration(
        {
          onLoad: () => undefined,
          off,
        } as unknown as HtmxLike,
        { initTree: vi.fn() },
      ),
    ).toThrow(/removable listener/u);
    expect(off).toHaveBeenCalledTimes(1);
  });
});
