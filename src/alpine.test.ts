import Alpine from 'alpinejs';
import { describe, expect, it } from 'vitest';

import {
  DuplicateToastIdError,
  createDisclosure,
  createDismissible,
  createTabs,
  createToastStack,
  registerAdminAlpine,
  type ToastItem,
} from './alpine.js';
import type { AlpineDataFactory, AlpineLike } from './types.js';
import { getAdminHtmlPattern } from './patterns.js';

const settleAlpine = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('admin Alpine behaviors', () => {
  it('registers each instance/prefix once and rejects missing libraries', () => {
    const registrations: string[] = [];
    const alpine: AlpineLike = {
      data(name) {
        registrations.push(name);
      },
    };
    expect(registerAdminAlpine(alpine)).toMatchObject({
      registered: true,
      providerNames: [
        'gtDisclosure',
        'gtDismissible',
        'gtToastStack',
        'gtTabs',
      ],
    });
    expect(registerAdminAlpine(alpine).registered).toBe(false);
    expect(registerAdminAlpine(alpine, { prefix: 'admin' }).registered).toBe(
      true,
    );
    expect(registrations).toHaveLength(8);
    expect(() => registerAdminAlpine({} as AlpineLike)).toThrow(/data/u);
    expect(() => registerAdminAlpine(alpine, { prefix: 'not safe' })).toThrow(
      /identifier-safe/u,
    );
    expect(() => registerAdminAlpine(alpine, { prefix: 'gt-admin' })).toThrow(
      /identifier-safe/u,
    );
  });

  it('runs registered providers through real Alpine 3.14', () => {
    const prefix = `integration${String(Date.now())}`;
    const registration = registerAdminAlpine(Alpine as AlpineLike, { prefix });
    expect(registration.registered).toBe(true);
    const root = document.createElement('section');
    root.setAttribute('x-data', `${prefix}Disclosure({ initiallyOpen: true })`);
    document.body.append(root);
    Alpine.initTree(root);
    const state = (root as unknown as { _x_dataStack: { open: boolean }[] })
      ._x_dataStack[0];
    expect(state?.open).toBe(true);
    Alpine.destroyTree(root);
    root.remove();
  });

  it('makes the published tabs and toast fixtures interactive in real Alpine', async () => {
    registerAdminAlpine(Alpine as AlpineLike);

    const tabs = document.createElement('div');
    tabs.innerHTML = getAdminHtmlPattern('tabs').htmlFixture;
    document.body.append(tabs);
    const tabsRoot = tabs.firstElementChild as HTMLElement;
    Alpine.initTree(tabsRoot);
    await settleAlpine();
    const tabButtons =
      tabsRoot.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const panels = tabsRoot.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    tabButtons[1]!.disabled = true;
    tabButtons[0]!.focus();
    tabButtons[0]!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    );
    await settleAlpine();
    expect(tabButtons[0]!.getAttribute('aria-selected')).toBe('true');
    expect(tabButtons[1]!.getAttribute('aria-selected')).toBe('false');
    expect(document.activeElement).toBe(tabButtons[0]);
    tabButtons[1]!.disabled = false;
    tabButtons[1]!.click();
    await settleAlpine();
    expect(tabButtons[0]!.getAttribute('aria-selected')).toBe('false');
    expect(tabButtons[1]!.getAttribute('aria-selected')).toBe('true');
    expect(panels[0]!.hidden).toBe(true);
    expect(panels[1]!.hidden).toBe(false);
    for (const [button, key, expected] of [
      [tabButtons[1]!, 'ArrowRight', tabButtons[0]!],
      [tabButtons[0]!, 'ArrowLeft', tabButtons[1]!],
      [tabButtons[1]!, 'Home', tabButtons[0]!],
      [tabButtons[0]!, 'End', tabButtons[1]!],
    ] as const) {
      button.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        }),
      );
      await settleAlpine();
      expect(document.activeElement, key).toBe(expected);
    }
    Alpine.destroyTree(tabsRoot);
    tabs.remove();

    const toasts = document.createElement('div');
    toasts.innerHTML = getAdminHtmlPattern('toast').htmlFixture;
    document.body.append(toasts);
    const toastRoot = toasts.firstElementChild as HTMLElement;
    Alpine.initTree(toastRoot);
    await settleAlpine();
    const toast = toastRoot.querySelector<HTMLElement>('.gt-toast')!;
    toast
      .querySelector<HTMLButtonElement>('[data-gt-region="dismiss"]')!
      .click();
    await settleAlpine();
    expect(toast.hidden).toBe(true);
    expect(document.activeElement).toBe(toastRoot);
    Alpine.destroyTree(toastRoot);
    toasts.remove();
  });

  it('normalizes disabled tabs before bindings and observes later changes', async () => {
    const prefix = `dynamic${String(Date.now())}`;
    registerAdminAlpine(Alpine as AlpineLike, { prefix });
    const root = document.createElement('div');
    root.setAttribute('x-data', `${prefix}Tabs(['overview', 'history'])`);
    root.innerHTML = `<div role="tablist">
      <button type="button" role="tab" data-gt-tab-id="overview" disabled x-bind:aria-selected="active === 'overview'" x-bind:tabindex="active === 'overview' ? 0 : -1">Overview</button>
      <button type="button" role="tab" data-gt-tab-id="history" x-bind:aria-selected="active === 'history'" x-bind:tabindex="active === 'history' ? 0 : -1">History</button>
    </div>
    <section role="tabpanel" x-bind:hidden="active !== 'overview'">Overview content</section>
    <section role="tabpanel" x-bind:hidden="active !== 'history'">History content</section>`;
    document.body.append(root);
    Alpine.initTree(root);
    await settleAlpine();

    const state = (
      root as unknown as {
        _x_dataStack: { active: string | null }[];
      }
    )._x_dataStack[0]!;
    const buttons = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const panels = root.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(state.active).toBe('history');
    expect([...buttons].map((button) => button.ariaSelected)).toEqual([
      'false',
      'true',
    ]);
    expect([...buttons].map((button) => button.tabIndex)).toEqual([-1, 0]);
    expect([...panels].map((panel) => panel.hidden)).toEqual([true, false]);

    buttons[1]!.focus();
    buttons[0]!.disabled = false;
    await settleAlpine();
    expect(state.active).toBe('history');
    expect(document.activeElement).toBe(buttons[1]);

    buttons[1]!.disabled = true;
    buttons[1]!.blur();
    expect(document.activeElement).toBe(document.body);
    await settleAlpine();
    expect(state.active).toBe('overview');
    expect(document.activeElement).toBe(buttons[0]);
    expect([...buttons].map((button) => button.ariaSelected)).toEqual([
      'true',
      'false',
    ]);
    expect([...buttons].map((button) => button.tabIndex)).toEqual([0, -1]);
    expect([...panels].map((panel) => panel.hidden)).toEqual([false, true]);

    buttons[0]!.disabled = true;
    buttons[0]!.blur();
    expect(document.activeElement).toBe(document.body);
    await settleAlpine();
    expect(state.active).toBeNull();
    expect(document.activeElement).toBe(root);
    expect([...buttons].map((button) => button.ariaSelected)).toEqual([
      'false',
      'false',
    ]);
    expect([...buttons].map((button) => button.tabIndex)).toEqual([-1, -1]);
    expect([...panels].map((panel) => panel.hidden)).toEqual([true, true]);

    buttons[0]!.disabled = false;
    await settleAlpine();
    expect(state.active).toBe('overview');
    expect(document.activeElement).toBe(buttons[0]);
    Alpine.destroyTree(root);
    expect(root.hasAttribute('tabindex')).toBe(false);
    buttons[0]!.disabled = true;
    await settleAlpine();
    expect(state.active).toBe('overview');
    root.remove();
  });

  it('recovers only focus that was lost because a selected tab was disabled', async () => {
    const setupTabs = () => {
      const root = document.createElement('div');
      root.innerHTML = `<button type="button" role="tab" data-gt-tab-id="alpha">Alpha</button>
        <button type="button" role="tab" data-gt-tab-id="beta">Beta</button>
        <button type="button" data-action>Non-tab action</button>`;
      document.body.append(root);
      const tabs = createTabs(['alpha', 'beta']);
      tabs.init(root);
      return {
        action: root.querySelector<HTMLButtonElement>('[data-action]')!,
        alpha: root.querySelector<HTMLButtonElement>(
          '[data-gt-tab-id="alpha"]',
        )!,
        beta: root.querySelector<HTMLButtonElement>('[data-gt-tab-id="beta"]')!,
        root,
        tabs,
      };
    };

    let fixture = setupTabs();
    fixture.alpha.focus();
    fixture.action.focus();
    fixture.alpha.disabled = true;
    await settleAlpine();
    expect(fixture.tabs.active).toBe('beta');
    expect(document.activeElement).toBe(fixture.action);
    fixture.tabs.destroy();
    fixture.root.remove();

    fixture = setupTabs();
    fixture.alpha.focus();
    fixture.alpha.disabled = true;
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    expect(document.activeElement).toBe(document.body);
    fixture.alpha.disabled = false;
    await settleAlpine();
    expect(fixture.tabs.active).toBe('alpha');
    expect(document.activeElement).toBe(fixture.alpha);
    document.body.removeAttribute('tabindex');
    fixture.tabs.destroy();
    fixture.root.remove();

    fixture = setupTabs();
    fixture.alpha.focus();
    fixture.alpha.blur();
    fixture.alpha.disabled = true;
    await settleAlpine();
    expect(fixture.tabs.active).toBe('beta');
    expect(document.activeElement).toBe(document.body);
    fixture.tabs.destroy();
    fixture.root.remove();
  });

  it('renders pushed toasts from a dynamic Alpine fixture', async () => {
    const prefix = `toast${String(Date.now())}`;
    registerAdminAlpine(Alpine as AlpineLike, { prefix });
    const root = document.createElement('section');
    root.setAttribute('x-data', `${prefix}ToastStack([])`);
    root.innerHTML = `<button type="button" data-add x-on:click="push({ id: 'runtime', title: 'Runtime', message: 'Added later', tone: 'info' })">Add</button>
      <template x-for="toast in toasts" x-bind:key="toast.id">
        <div class="gt-toast" x-bind:data-toast-id="toast.id">
          <strong x-text="toast.title"></strong><span x-text="toast.message"></span>
        </div>
      </template>`;
    document.body.append(root);
    Alpine.initTree(root);
    await settleAlpine();
    expect(root.querySelector('.gt-toast')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-add]')!.click();
    await settleAlpine();
    expect(root.querySelector<HTMLElement>('.gt-toast')?.dataset.toastId).toBe(
      'runtime',
    );
    expect(root.querySelector('.gt-toast')?.textContent).toContain(
      'Added later',
    );
    Alpine.destroyTree(root);
    root.remove();
  });

  it('provides deterministic disclosure and dismissible state', () => {
    const disclosure = createDisclosure({ initiallyOpen: true });
    disclosure.init();
    disclosure.toggle();
    expect(disclosure.open).toBe(false);
    disclosure.show();
    disclosure.hide();
    expect(disclosure.open).toBe(false);

    const dismissible = createDismissible({ initiallyVisible: false });
    dismissible.init();
    dismissible.restore();
    dismissible.dismiss();
    expect(dismissible.visible).toBe(false);
  });

  it('enforces unique toast IDs and bounded tab selection', () => {
    const stack = createToastStack([
      { id: 'one', message: 'First', tone: 'info' },
    ]);
    stack.init();
    stack.push({ id: 'two', message: 'Second' });
    expect(() => stack.push({ id: 'two', message: 'Duplicate' })).toThrow(
      DuplicateToastIdError,
    );
    expect(() =>
      createToastStack([
        { id: 'same', message: 'First' },
        { id: 'same', message: 'Second' },
      ]),
    ).toThrow(DuplicateToastIdError);
    expect(() => createToastStack([{ id: '', message: 'Missing id' }])).toThrow(
      /non-empty/u,
    );
    for (const id of ['space id', `nul\0id`, '-leading']) {
      expect(() => createToastStack([{ id, message: 'Unsafe id' }])).toThrow(
        /DOM-safe/u,
      );
    }
    for (const invalid of [
      null,
      { id: 'bad-message', message: 42 },
      { id: 'bad-title', message: 'Message', title: 42 },
      { id: 'bad-tone', message: 'Message', tone: 'bogus' },
    ]) {
      expect(() => createToastStack([invalid] as never)).toThrow(TypeError);
    }
    expect(Object.isFrozen(stack.toasts)).toBe(true);
    expect(() =>
      (stack.toasts as ToastItem[]).push({
        id: 'two',
        message: 'Bypass duplicate validation',
      }),
    ).toThrow(TypeError);
    expect(stack.toasts.map(({ id }) => id)).toEqual(['one', 'two']);
    stack.remove('one');
    stack.clear();
    expect(stack.toasts).toEqual([]);

    const tabs = createTabs(['overview', 'history'], 'history');
    tabs.init();
    expect(tabs.previous()).toBe('overview');
    expect(tabs.next()).toBe('history');
    expect(tabs.first()).toBe('overview');
    expect(tabs.last()).toBe('history');
    expect(tabs.select('missing')).toBe(false);
    expect(tabs.select('overview')).toBe(true);
    tabs.active = 'missing';
    tabs.init();
    expect(tabs.active).toBe('overview');
    expect(() => createTabs([])).toThrow(/unique letter-first/u);
    expect(() => createTabs(['same', 'same'])).toThrow(/unique letter-first/u);
    const disabledTabs = createTabs(
      ['overview', 'history', 'settings'],
      'overview',
      ['history'],
    );
    expect(disabledTabs.next()).toBe('settings');
    expect(disabledTabs.previous()).toBe('overview');
    expect(disabledTabs.select('history')).toBe(false);
    expect(disabledTabs.last()).toBe('settings');
    expect(disabledTabs.first()).toBe('overview');
    expect(disabledTabs.next(['overview', 'settings'])).toBeNull();
    expect(disabledTabs.active).toBeNull();
    expect(disabledTabs.first(['overview', 'settings'])).toBeNull();
    expect(disabledTabs.last(['overview', 'settings'])).toBeNull();
    expect(() => createTabs(['one'], undefined, ['one'])).toThrow(
      /remain enabled/u,
    );
    expect(() => createTabs(['one'], undefined, ['missing'])).toThrow(
      /members/u,
    );
    for (const id of ['space id', `nul\0id`, '-leading']) {
      expect(() => createTabs([id])).toThrow(/DOM-safe/u);
    }
    expect(() => createTabs(['1leading'])).toThrow(/letter-first/u);
    expect(() => createTabs('overview' as never)).toThrow(/array/u);
    expect(() => createTabs(['overview', 1] as never)).toThrow(/letter-first/u);
    expect(() => createTabs(['overview'], 1 as never)).toThrow(/string/u);
    expect(() => createTabs(['overview'], 'missing')).toThrow(/belong/u);
    expect(() =>
      createTabs(['overview'], undefined, 'overview' as never),
    ).toThrow(/array/u);
    expect(() =>
      createTabs(['overview', 'history'], undefined, [1] as never),
    ).toThrow(/unique members/u);
    expect(() =>
      createTabs(['overview', 'history'], undefined, ['history', 'history']),
    ).toThrow(/unique members/u);
    expect(() =>
      createTabs(['overview', 'history'], 'history', ['history']),
    ).toThrow(/must be enabled/u);
  });

  it('adapts unknown provider arguments without sharing mutable state', () => {
    const registrations = new Map<string, AlpineDataFactory>();
    const alpine: AlpineLike = {
      data(name, factory) {
        registrations.set(name, factory);
      },
    };
    registerAdminAlpine(alpine, { prefix: 'isolated' });
    const first = registrations.get('isolatedToastStack')?.('invalid') as {
      readonly toasts: readonly unknown[];
    };
    const second = registrations.get('isolatedToastStack')?.([]) as {
      readonly toasts: readonly unknown[];
    };
    expect(() => (first.toasts as unknown[]).push('local')).toThrow(TypeError);
    expect(second.toasts).toEqual([]);
    const tabsFactory = registrations.get('isolatedTabs')!;
    expect(() => tabsFactory(['overview', 1])).toThrow(/letter-first/u);
    expect(() => tabsFactory('overview')).toThrow(/array/u);
    expect(() => tabsFactory(['overview'], 1)).toThrow(/string/u);
    expect(() => tabsFactory(['overview'], undefined, ['overview', 1])).toThrow(
      /unique members/u,
    );
  });
});
