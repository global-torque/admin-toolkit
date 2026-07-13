import { describe, expect, it, vi } from 'vitest';

import { createDialogController } from './alpine.js';

const setup = () => {
  document.body.innerHTML = `<button id="trigger" type="button">Open</button>
    <div id="dialog" role="dialog" aria-modal="true" hidden>
      <button id="first" type="button" data-gt-dialog-initial-focus>Confirm</button>
      <button id="last" type="button" data-gt-dialog-close>Cancel</button>
    </div>`;
  return {
    trigger: document.querySelector<HTMLElement>('#trigger')!,
    dialog: document.querySelector<HTMLElement>('#dialog')!,
    first: document.querySelector<HTMLElement>('#first')!,
    last: document.querySelector<HTMLElement>('#last')!,
  };
};

describe('accessible dialog controller', () => {
  it('moves and traps focus, closes on Escape, and returns focus', () => {
    const { trigger, dialog, first, last } = setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    trigger.focus();
    const controller = createDialogController(dialog, { onOpen, onClose });
    controller.open();
    expect(controller.isOpen).toBe(true);
    expect(dialog.hidden).toBe(false);
    expect(dialog.getAttribute('aria-hidden')).toBe('false');
    expect(document.activeElement).toBe(first);

    last.focus();
    last.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(last);

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(controller.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('contains external programmatic focus and handles external Escape', () => {
    const { trigger, dialog, first } = setup();
    const outside = document.createElement('button');
    outside.type = 'button';
    outside.textContent = 'Outside';
    document.body.append(outside);
    const blockedFocusListener = vi.fn((event: FocusEvent) => {
      event.stopPropagation();
    });
    const blockedKeyListener = vi.fn((event: KeyboardEvent) => {
      event.stopPropagation();
    });
    outside.addEventListener('focusin', blockedFocusListener);
    outside.addEventListener('keydown', blockedKeyListener);
    const captureFocusBlocker = vi.fn((event: FocusEvent) => {
      event.stopPropagation();
    });
    const captureKeyBlocker = vi.fn((event: KeyboardEvent) => {
      event.stopPropagation();
    });
    document.addEventListener('focusin', captureFocusBlocker, true);
    document.addEventListener('keydown', captureKeyBlocker, true);
    trigger.focus();
    const controller = createDialogController(dialog);
    controller.open();

    outside.focus();
    expect(document.activeElement).toBe(first);
    expect(captureFocusBlocker).toHaveBeenCalled();
    expect(blockedFocusListener).not.toHaveBeenCalled();
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    outside.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(captureKeyBlocker).toHaveBeenCalledTimes(1);
    expect(blockedKeyListener).not.toHaveBeenCalled();
    expect(controller.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);

    controller.destroy();
    document.removeEventListener('focusin', captureFocusBlocker, true);
    document.removeEventListener('keydown', captureKeyBlocker, true);
    outside.focus();
    expect(document.activeElement).toBe(outside);
    expect(blockedFocusListener).toHaveBeenCalledTimes(1);
    const detachedEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    outside.dispatchEvent(detachedEscape);
    expect(detachedEscape.defaultPrevented).toBe(false);
    expect(blockedKeyListener).toHaveBeenCalledTimes(1);
  });

  it('makes every outside layer inert and restores exact prior state', () => {
    document.body.innerHTML = `<header id="legacy" inert="legacy-value" aria-hidden="false">Legacy</header>
      <main>
        <button id="trigger" type="button">Open</button>
        <aside id="nearby" aria-hidden="false"><button id="outside" type="button">Outside</button></aside>
        <div id="dialog-host">
          <div id="dialog" role="dialog" aria-modal="true" hidden><button id="inside" type="button">Inside</button></div>
        </div>
      </main>`;
    const legacy = document.querySelector<HTMLElement>('#legacy')!;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const nearby = document.querySelector<HTMLElement>('#nearby')!;
    const outside = document.querySelector<HTMLButtonElement>('#outside')!;
    const dialog = document.querySelector<HTMLElement>('#dialog')!;
    const outsideClick = vi.fn();
    outside.addEventListener('click', outsideClick);
    trigger.focus();
    const controller = createDialogController(dialog);
    controller.open();

    expect(legacy.getAttribute('inert')).toBe('');
    expect(legacy.getAttribute('aria-hidden')).toBe('true');
    expect(trigger.hasAttribute('inert')).toBe(true);
    expect(trigger.getAttribute('aria-hidden')).toBe('true');
    expect(nearby.hasAttribute('inert')).toBe(true);
    expect(nearby.getAttribute('aria-hidden')).toBe('true');
    outside.click();
    expect(outsideClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      document.querySelector<HTMLElement>('#inside'),
    );

    controller.close();
    expect(legacy.getAttribute('inert')).toBe('legacy-value');
    expect(legacy.getAttribute('aria-hidden')).toBe('false');
    expect(trigger.hasAttribute('inert')).toBe(false);
    expect(trigger.hasAttribute('aria-hidden')).toBe(false);
    expect(nearby.hasAttribute('inert')).toBe(false);
    expect(nearby.getAttribute('aria-hidden')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    outside.click();
    expect(outsideClick).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('closes only the topmost dialog and restores focus into the revealed dialog', () => {
    document.body.innerHTML = `<button id="trigger" type="button">Open first</button>
      <div id="first-dialog" role="dialog" aria-modal="true" hidden>
        <button id="open-second" type="button">Open second</button>
      </div>
      <div id="second-dialog" role="dialog" aria-modal="true" hidden>
        <button id="second-action" type="button">Second action</button>
      </div>`;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const firstDialog = document.querySelector<HTMLElement>('#first-dialog')!;
    const openSecond = document.querySelector<HTMLElement>('#open-second')!;
    const secondDialog = document.querySelector<HTMLElement>('#second-dialog')!;
    const first = createDialogController(firstDialog);
    const second = createDialogController(secondDialog);
    trigger.focus();
    first.open();
    second.open(openSecond);
    expect(firstDialog.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(
      document.querySelector<HTMLElement>('#second-action'),
    );

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(second.isOpen).toBe(false);
    expect(first.isOpen).toBe(true);
    expect(firstDialog.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(openSecond);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(first.isOpen).toBe(false);
    expect(document.activeElement).toBe(trigger);
    first.destroy();
    second.destroy();
  });

  it('does not steal focus when a non-top dialog closes or is destroyed', () => {
    document.body.innerHTML = `<button id="trigger" type="button">Open first</button>
      <div id="first-dialog" role="dialog" aria-modal="true" hidden>
        <button id="open-second" type="button">Open second</button>
      </div>
      <div id="second-dialog" role="dialog" aria-modal="true" hidden>
        <button id="second-action" type="button">Second action</button>
      </div>`;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const firstDialog = document.querySelector<HTMLElement>('#first-dialog')!;
    const openSecond = document.querySelector<HTMLElement>('#open-second')!;
    const secondDialog = document.querySelector<HTMLElement>('#second-dialog')!;
    const secondAction = document.querySelector<HTMLElement>('#second-action')!;
    const first = createDialogController(firstDialog);
    const second = createDialogController(secondDialog);
    trigger.focus();
    first.open();
    second.open(openSecond);
    expect(document.activeElement).toBe(secondAction);

    first.close();
    expect(firstDialog.hidden).toBe(true);
    expect(second.isOpen).toBe(true);
    expect(document.activeElement).toBe(secondAction);
    expect(trigger.hasAttribute('inert')).toBe(true);

    first.open(trigger);
    expect(document.activeElement).toBe(openSecond);
    second.destroy();
    expect(first.isOpen).toBe(true);
    expect(secondDialog.hidden).toBe(true);
    expect(document.activeElement).toBe(openSecond);
    first.destroy();
    expect(document.activeElement).toBe(trigger);
    expect(secondDialog.hasAttribute('inert')).toBe(false);
  });

  it('keeps a dialog opened by an onOpen hook topmost', () => {
    document.body.innerHTML = `<button id="trigger" type="button">Open first</button>
      <div id="first-dialog" role="dialog" aria-modal="true" hidden>
        <button id="open-second" type="button">Open second</button>
      </div>
      <div id="second-dialog" role="dialog" aria-modal="true" hidden>
        <button id="second-action" type="button">Second action</button>
      </div>`;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const firstDialog = document.querySelector<HTMLElement>('#first-dialog')!;
    const openSecond = document.querySelector<HTMLElement>('#open-second')!;
    const secondDialog = document.querySelector<HTMLElement>('#second-dialog')!;
    const secondAction = document.querySelector<HTMLElement>('#second-action')!;
    const second = createDialogController(secondDialog);
    const first = createDialogController(firstDialog, {
      onOpen() {
        second.open(openSecond);
      },
    });
    trigger.focus();
    first.open();
    expect(first.isOpen).toBe(true);
    expect(second.isOpen).toBe(true);
    expect(firstDialog.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(secondAction);

    second.close();
    expect(document.activeElement).toBe(openSecond);
    first.destroy();
    second.destroy();
    expect(document.activeElement).toBe(trigger);
  });

  it('supports close controls, explicit invokers, escape policy, and cleanup', () => {
    const { trigger, dialog, last } = setup();
    const blockedCloseHandler = vi.fn((event: MouseEvent) => {
      event.stopPropagation();
    });
    last.addEventListener('click', blockedCloseHandler);
    const controller = createDialogController(dialog, { closeOnEscape: false });
    controller.open(trigger);
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(controller.isOpen).toBe(true);
    last.click();
    expect(blockedCloseHandler).not.toHaveBeenCalled();
    expect(controller.isOpen).toBe(false);
    expect(document.activeElement).toBe(trigger);
    controller.open(trigger);
    controller.destroy();
    expect(controller.isOpen).toBe(false);
  });

  it('lets only the top nested dialog own its capture-phase close control', () => {
    document.body.innerHTML = `<button id="trigger" type="button">Open</button>
      <div id="first-dialog" role="dialog" aria-modal="true" hidden>
        <button id="open-second" type="button">Open second</button>
        <button id="first-close" type="button" data-gt-dialog-close>Close first</button>
        <div id="second-dialog" role="dialog" aria-modal="true" hidden>
          <button id="second-close" type="button" data-gt-dialog-close>Close second</button>
        </div>
      </div>`;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const firstDialog = document.querySelector<HTMLElement>('#first-dialog')!;
    const openSecond = document.querySelector<HTMLElement>('#open-second')!;
    const firstClose =
      document.querySelector<HTMLButtonElement>('#first-close')!;
    const secondDialog = document.querySelector<HTMLElement>('#second-dialog')!;
    const secondClose =
      document.querySelector<HTMLButtonElement>('#second-close')!;
    const bypass = vi.fn((event: MouseEvent) => {
      event.stopPropagation();
    });
    secondClose.addEventListener('click', bypass);
    const first = createDialogController(firstDialog);
    const second = createDialogController(secondDialog);
    trigger.focus();
    first.open();
    second.open(openSecond);

    secondClose.click();
    expect(bypass).not.toHaveBeenCalled();
    expect(second.isOpen).toBe(false);
    expect(first.isOpen).toBe(true);
    expect(document.activeElement).toBe(openSecond);

    firstClose.click();
    expect(first.isOpen).toBe(false);
    expect(document.activeElement).toBe(trigger);
    first.destroy();
    second.destroy();
  });

  it('allows only one live controller per dialog element', () => {
    const { dialog } = setup();
    const first = createDialogController(dialog);
    expect(() => createDialogController(dialog)).toThrow(/live controller/u);
    first.open();
    first.close();
    expect(() => createDialogController(dialog)).toThrow(/live controller/u);
    first.destroy();
    const replacement = createDialogController(dialog);
    replacement.destroy();
  });

  it('focuses an empty dialog itself and validates its target', () => {
    document.body.innerHTML =
      '<button id="trigger">Open</button><div id="dialog" role="dialog" hidden></div>';
    const dialog = document.querySelector<HTMLElement>('#dialog')!;
    const controller = createDialogController(dialog);
    controller.open(document.querySelector<HTMLElement>('#trigger'));
    expect(dialog.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(dialog);
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(dialog);
    controller.destroy();
    expect(dialog.hasAttribute('tabindex')).toBe(false);
    expect(() => createDialogController(null as never)).toThrow(/required/u);
    expect(() =>
      createDialogController(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg') as never,
      ),
    ).toThrow(/HTMLElement/u);
    expect(() =>
      createDialogController({
        ownerDocument: document,
        querySelectorAll() {
          return [];
        },
      } as never),
    ).toThrow(/HTMLElement/u);
  });

  it('rolls back invalid selectors and throwing lifecycle hooks', () => {
    const { trigger, dialog } = setup();
    trigger.focus();
    const invalidSelector = createDialogController(dialog, {
      initialFocus: '[',
    });
    expect(() => invalidSelector.open()).toThrow();
    expect(invalidSelector.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    invalidSelector.destroy();

    const openHookError = new Error('open hook failed');
    const openFailure = createDialogController(dialog, {
      onOpen() {
        throw openHookError;
      },
    });
    let receivedOpenFailure: unknown;
    try {
      openFailure.open();
    } catch (error) {
      receivedOpenFailure = error;
    }
    expect(receivedOpenFailure).toBe(openHookError);
    expect(openFailure.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(dialog.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(trigger);
    openFailure.destroy();

    const rawOpenFailure = createDialogController(dialog, {
      onOpen() {
        // Deliberately exercise normalization of hostile JavaScript callers.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'raw-open-failure';
      },
    });
    let normalizedOpenFailure: unknown;
    try {
      rawOpenFailure.open();
    } catch (error) {
      normalizedOpenFailure = error;
    }
    expect(normalizedOpenFailure).toBeInstanceOf(Error);
    expect((normalizedOpenFailure as Error).message).toBe(
      'Dialog open lifecycle failed.',
    );
    expect((normalizedOpenFailure as Error & { cause?: unknown }).cause).toBe(
      'raw-open-failure',
    );
    expect(rawOpenFailure.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(dialog.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(trigger);
    rawOpenFailure.destroy();

    const closeFailure = createDialogController(dialog, {
      onClose() {
        throw new Error('close hook failed');
      },
    });
    closeFailure.open(trigger);
    expect(() => closeFailure.close()).toThrow('close hook failed');
    expect(closeFailure.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    closeFailure.destroy();
  });

  it('excludes non-tabbable descendants and reconciles reentrant hooks', () => {
    document.body.innerHTML = `<button id="trigger" type="button">Open</button>
      <div id="dialog" role="dialog" hidden>
        <button id="excluded" type="button" tabindex="-1" data-gt-dialog-initial-focus>Excluded</button>
        <div hidden><button type="button">Hidden</button></div>
        <div inert><button type="button">Inert</button></div>
        <fieldset disabled><button type="button">Fieldset disabled</button></fieldset>
        <div style="display: none"><button type="button">Display none</button></div>
        <div style="visibility: hidden"><button type="button">Visibility hidden</button></div>
        <button id="eligible" type="button">Eligible</button>
      </div>`;
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    const dialog = document.querySelector<HTMLElement>('#dialog')!;
    const eligible = document.querySelector<HTMLElement>('#eligible')!;
    trigger.focus();
    const filtered = createDialogController(dialog);
    filtered.open();
    expect(document.activeElement).toBe(eligible);
    filtered.close();
    filtered.destroy();

    let closeDuringOpen!: ReturnType<typeof createDialogController>;
    closeDuringOpen = createDialogController(dialog, {
      onOpen() {
        closeDuringOpen.close();
      },
    });
    closeDuringOpen.open(trigger);
    expect(closeDuringOpen.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    closeDuringOpen.destroy();

    let openDuringClose!: ReturnType<typeof createDialogController>;
    openDuringClose = createDialogController(dialog, {
      onClose() {
        openDuringClose.open(trigger);
      },
    });
    openDuringClose.open(trigger);
    openDuringClose.close();
    expect(openDuringClose.isOpen).toBe(true);
    expect(dialog.hidden).toBe(false);
    expect(document.activeElement).toBe(eligible);
    openDuringClose.destroy();
    expect(openDuringClose.isOpen).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(() => openDuringClose.open()).toThrow(/destroyed/u);
    openDuringClose.destroy();
  });
});
