import { tabbable } from 'tabbable';

import type {
  AdminAlpineRegistration,
  AdminAlpineRegistrationOptions,
  AlpineDataFactory,
  AlpineLike,
} from './types.js';

/** Options for disclosure state. @public */
export interface DisclosureOptions {
  /** Initial expanded state; defaults to `false`. */
  readonly initiallyOpen?: boolean;
}

/** Alpine-compatible disclosure state. @public */
export interface DisclosureState {
  /** Current expanded state. */
  open: boolean;
  /** Normalize externally supplied initial state. */
  init(): void;
  /** Expand the disclosure. */
  show(): void;
  /** Collapse the disclosure. */
  hide(): void;
  /** Invert the current expanded state. */
  toggle(): void;
}

/** Create isolated disclosure state. @public */
export function createDisclosure({
  initiallyOpen = false,
}: DisclosureOptions = {}): DisclosureState {
  return {
    open: initiallyOpen === true,
    init() {
      this.open = this.open === true;
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

/** Options for dismissible state. @public */
export interface DismissibleOptions {
  /** Initial visibility; defaults to `true`. */
  readonly initiallyVisible?: boolean;
}

/** Alpine-compatible dismissible state. @public */
export interface DismissibleState {
  /** Current visibility state. */
  visible: boolean;
  /** Normalize externally supplied initial state. */
  init(): void;
  /** Hide the item. */
  dismiss(): void;
  /** Show a previously dismissed item. */
  restore(): void;
}

/** Create isolated dismissible state. @public */
export function createDismissible({
  initiallyVisible = true,
}: DismissibleOptions = {}): DismissibleState {
  return {
    visible: initiallyVisible !== false,
    init() {
      this.visible = this.visible === true;
    },
    dismiss() {
      this.visible = false;
    },
    restore() {
      this.visible = true;
    },
  };
}

/** One transport-neutral toast item. @public */
export interface ToastItem {
  /** Unique DOM-safe host identifier. */
  readonly id: string;
  /** Supported visual and announcement tone. */
  readonly tone?: 'danger' | 'info' | 'neutral' | 'success' | 'warning';
  /** Optional short heading. */
  readonly title?: string;
  /** Required user-facing message. */
  readonly message: string;
}

/** Error thrown when a toast stack would contain duplicate DOM identifiers. @public */
export class DuplicateToastIdError extends Error {
  /** Identifier that collided with an existing toast. */
  readonly id: string;

  constructor(id: string) {
    super(`Duplicate toast identifier: ${JSON.stringify(id)}.`);
    this.name = 'DuplicateToastIdError';
    this.id = id;
  }
}

/** Alpine-compatible bounded toast collection. @public */
export interface ToastStackState {
  /** Current validated toast collection. */
  readonly toasts: readonly ToastItem[];
  /** Revalidate externally restored state. */
  init(): void;
  /** Append one validated uniquely identified toast. */
  push(toast: ToastItem): void;
  /** Remove every toast matching an identifier. */
  remove(id: string): void;
  /** Remove all toasts. */
  clear(): void;
}

const DOM_SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/u;
const TAB_SAFE_ID = /^[A-Za-z][A-Za-z0-9_-]*$/u;
const isRuntimeArray = (value: unknown): boolean => Array.isArray(value);

const copyUniqueToasts = (
  toasts: readonly ToastItem[],
): readonly ToastItem[] => {
  const seen = new Set<string>();
  return Object.freeze(
    toasts.map((toast) => {
      if (toast === null || typeof toast !== 'object' || Array.isArray(toast)) {
        throw new TypeError('Toast items must be objects.');
      }
      const { id, message, title, tone } = toast;
      if (typeof id !== 'string' || !DOM_SAFE_ID.test(id)) {
        throw new TypeError(
          'Toast identifiers must be non-empty DOM-safe strings.',
        );
      }
      if (typeof message !== 'string') {
        throw new TypeError('Toast messages must be strings.');
      }
      if (title !== undefined && typeof title !== 'string') {
        throw new TypeError('Toast titles must be strings when provided.');
      }
      if (
        tone !== undefined &&
        !['danger', 'info', 'neutral', 'success', 'warning'].includes(tone)
      ) {
        throw new TypeError('Toast tones must use a documented value.');
      }
      if (seen.has(id)) throw new DuplicateToastIdError(id);
      seen.add(id);
      return Object.freeze({
        id,
        message,
        ...(title === undefined ? {} : { title }),
        ...(tone === undefined ? {} : { tone }),
      });
    }),
  );
};

const TOAST_ITEMS: unique symbol = Symbol('toast-items');

type ToastStackImplementation = Omit<ToastStackState, 'toasts'> & {
  [TOAST_ITEMS]: readonly ToastItem[];
  readonly toasts: readonly ToastItem[];
};

/**
 * Create a stack that preserves unique, stable toast identifiers.
 *
 * @throws {@link DuplicateToastIdError} for repeated identifiers.
 * @throws `TypeError` for malformed runtime items, messages, titles, or tones.
 * @public
 */
export function createToastStack(
  initialToasts: readonly ToastItem[] = [],
): ToastStackState {
  const state: ToastStackImplementation = {
    [TOAST_ITEMS]: copyUniqueToasts(initialToasts),
    get toasts() {
      return this[TOAST_ITEMS];
    },
    init() {
      this[TOAST_ITEMS] = copyUniqueToasts(this[TOAST_ITEMS]);
    },
    push(toast) {
      this[TOAST_ITEMS] = copyUniqueToasts([...this[TOAST_ITEMS], toast]);
    },
    remove(id) {
      this[TOAST_ITEMS] = Object.freeze(
        this[TOAST_ITEMS].filter((toast) => toast.id !== id),
      );
    },
    clear() {
      this[TOAST_ITEMS] = Object.freeze([]);
    },
  };
  return state;
}

/** Alpine-compatible keyboard tab state. @public */
export interface TabsState {
  /** Stable ordered tab identifiers. */
  readonly ids: readonly string[];
  /** Tab identifiers disabled for the lifetime of this state. */
  readonly disabledIds: readonly string[];
  /** Currently selected enabled tab identifier, or `null` when none is enabled. */
  active: string | null;
  /** Normalize selection from an optional fixture root and observe disabled tabs. */
  init(root?: ParentNode): void;
  /** Release the disabled-tab observer; Alpine invokes this lifecycle automatically. */
  destroy(): void;
  /** Read currently disabled tab identifiers from a fixture subtree. */
  disabledIn(root: ParentNode): readonly string[];
  /** Select an enabled identifier and report whether selection changed. */
  select(id: string, disabledIds?: readonly string[]): boolean;
  /** Select the next enabled identifier with wraparound. */
  next(disabledIds?: readonly string[]): string | null;
  /** Select the previous enabled identifier with wraparound. */
  previous(disabledIds?: readonly string[]): string | null;
  /** Select the first enabled identifier. */
  first(disabledIds?: readonly string[]): string | null;
  /** Select the last enabled identifier. */
  last(disabledIds?: readonly string[]): string | null;
}

/**
 * Create deterministic roving-selection state for a tab list.
 *
 * @throws `TypeError` for empty, duplicate, unknown-disabled, or fully disabled
 * tab sets.
 * @public
 */
export function createTabs(
  input: readonly string[],
  initiallyActive?: string,
  initiallyDisabled: readonly string[] = [],
): TabsState {
  if (!isRuntimeArray(input)) {
    throw new TypeError('Tab identifiers must be provided as an array.');
  }
  if (!isRuntimeArray(initiallyDisabled)) {
    throw new TypeError(
      'Disabled tab identifiers must be provided as an array.',
    );
  }
  if (initiallyActive !== undefined && typeof initiallyActive !== 'string') {
    throw new TypeError(
      'The initially active tab identifier must be a string.',
    );
  }
  const ids = [...input];
  if (
    ids.length === 0 ||
    ids.some((id) => typeof id !== 'string' || !TAB_SAFE_ID.test(id)) ||
    new Set(ids).size !== ids.length
  ) {
    throw new TypeError(
      'Tab identifiers must be unique letter-first DOM-safe strings.',
    );
  }
  if (
    initiallyDisabled.some(
      (id) => typeof id !== 'string' || !TAB_SAFE_ID.test(id),
    ) ||
    new Set(initiallyDisabled).size !== initiallyDisabled.length ||
    initiallyDisabled.some((id) => !ids.includes(id))
  ) {
    throw new TypeError(
      'Disabled tab identifiers must be unique members of the tab set.',
    );
  }
  if (
    initiallyActive !== undefined &&
    (!TAB_SAFE_ID.test(initiallyActive) || !ids.includes(initiallyActive))
  ) {
    throw new TypeError('The initially active tab must belong to the tab set.');
  }
  const disabledIds = [...initiallyDisabled];
  if (initiallyActive !== undefined && disabledIds.includes(initiallyActive)) {
    throw new TypeError('The initially active tab must be enabled.');
  }
  const defaultDisabled = new Set(disabledIds);
  const enabled = (additional: readonly string[] = []): string[] => {
    if (
      !isRuntimeArray(additional) ||
      additional.some(
        (id) =>
          typeof id !== 'string' || !TAB_SAFE_ID.test(id) || !ids.includes(id),
      )
    ) {
      throw new TypeError(
        'Disabled tab identifiers must belong to the tab set.',
      );
    }
    const blocked = new Set([...defaultDisabled, ...additional]);
    return ids.filter((id) => !blocked.has(id));
  };
  if (enabled().length === 0) {
    throw new TypeError('At least one tab must remain enabled.');
  }
  const initialEnabled = enabled();
  const initial = initiallyActive ?? initialEnabled[0]!;
  let observer: MutationObserver | null = null;
  let observerGeneration = 0;
  let observedRoot: HTMLElement | null = null;
  let addedRootTabIndex = false;
  let lastFocusedTabId: string | null = null;
  let onRootFocusIn: ((event: FocusEvent) => void) | null = null;
  let onRootFocusOut: ((event: FocusEvent) => void) | null = null;

  const detachRootFocusTracking = () => {
    if (observedRoot && onRootFocusIn) {
      observedRoot.removeEventListener('focusin', onRootFocusIn, true);
    }
    if (observedRoot && onRootFocusOut) {
      observedRoot.removeEventListener('focusout', onRootFocusOut, true);
    }
    lastFocusedTabId = null;
    onRootFocusIn = null;
    onRootFocusOut = null;
  };

  const normalize = (
    state: TabsState,
    additionalDisabled: readonly string[] = [],
  ): readonly string[] => {
    const available = enabled(additionalDisabled);
    if (state.active === null || !available.includes(state.active)) {
      state.active = available[0] ?? null;
    }
    return available;
  };

  const state: TabsState = {
    ids: Object.freeze(ids),
    disabledIds: Object.freeze(disabledIds),
    active: initial,
    init(root) {
      observer?.disconnect();
      observer = null;
      observerGeneration += 1;
      const generation = observerGeneration;
      detachRootFocusTracking();
      if (addedRootTabIndex) observedRoot?.removeAttribute('tabindex');
      observedRoot = null;
      addedRootTabIndex = false;
      const alpineRoot = Reflect.get(this, '$root') as unknown;
      const fixtureRoot =
        root ??
        (alpineRoot !== null &&
        typeof alpineRoot === 'object' &&
        'querySelectorAll' in alpineRoot
          ? (alpineRoot as ParentNode)
          : undefined);
      normalize(this, fixtureRoot ? this.disabledIn(fixtureRoot) : []);

      const ownerDocument =
        fixtureRoot && 'ownerDocument' in fixtureRoot
          ? fixtureRoot.ownerDocument
          : null;
      const MutationObserverConstructor =
        ownerDocument?.defaultView?.MutationObserver;
      const HTMLElementConstructor = ownerDocument?.defaultView?.HTMLElement;
      if (
        fixtureRoot &&
        HTMLElementConstructor &&
        fixtureRoot instanceof HTMLElementConstructor
      ) {
        observedRoot = fixtureRoot;
        onRootFocusIn = (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElementConstructor)) return;
          if (
            target === observedRoot ||
            !target.matches('[role="tab"][data-gt-tab-id]')
          ) {
            lastFocusedTabId = null;
            return;
          }
          const id = target.dataset.gtTabId;
          lastFocusedTabId = id && ids.includes(id) ? id : null;
        };
        onRootFocusOut = (event) => {
          const target = event.target;
          if (
            target instanceof HTMLElementConstructor &&
            target.matches('[role="tab"][data-gt-tab-id]') &&
            target.hasAttribute('disabled') &&
            target.dataset.gtTabId === lastFocusedTabId
          ) {
            return;
          }
          lastFocusedTabId = null;
        };
        observedRoot.addEventListener('focusin', onRootFocusIn, true);
        observedRoot.addEventListener('focusout', onRootFocusOut, true);
      }
      if (
        fixtureRoot &&
        MutationObserverConstructor &&
        HTMLElementConstructor &&
        'nodeType' in fixtureRoot
      ) {
        observer = new MutationObserverConstructor((records) => {
          const previousActive = this.active;
          const activeElement = ownerDocument.activeElement;
          const disabledFocusedTabId = lastFocusedTabId;
          const focusedTabWasDisabled = records.some(
            (record) =>
              record.type === 'attributes' &&
              record.attributeName === 'disabled' &&
              record.target instanceof HTMLElementConstructor &&
              record.target.dataset.gtTabId === disabledFocusedTabId,
          );
          const shouldRecoverFocus =
            (activeElement instanceof HTMLElementConstructor &&
              ((activeElement === observedRoot && previousActive === null) ||
                (activeElement.matches('[role="tab"][data-gt-tab-id]') &&
                  activeElement.dataset.gtTabId === previousActive))) ||
            (focusedTabWasDisabled && disabledFocusedTabId === previousActive);
          normalize(this, this.disabledIn(fixtureRoot));
          if (focusedTabWasDisabled) lastFocusedTabId = null;
          if (
            !shouldRecoverFocus ||
            (this.active === previousActive && !focusedTabWasDisabled)
          ) {
            return;
          }
          ownerDocument.defaultView?.queueMicrotask(() => {
            if (generation !== observerGeneration) return;
            const next = [
              ...fixtureRoot.querySelectorAll<HTMLElement>(
                '[role="tab"][data-gt-tab-id]',
              ),
            ].find(
              (element) =>
                element.dataset.gtTabId === this.active &&
                !element.hasAttribute('disabled'),
            );
            if (next) {
              next.focus();
              return;
            }
            if (observedRoot) {
              if (!observedRoot.hasAttribute('tabindex')) {
                observedRoot.setAttribute('tabindex', '-1');
                addedRootTabIndex = true;
              }
              observedRoot.focus();
            }
          });
        });
        observer.observe(fixtureRoot, {
          attributes: true,
          attributeFilter: ['data-gt-tab-id', 'disabled'],
          childList: true,
          subtree: true,
        });
      }
    },
    destroy() {
      observer?.disconnect();
      observer = null;
      observerGeneration += 1;
      detachRootFocusTracking();
      if (addedRootTabIndex) observedRoot?.removeAttribute('tabindex');
      observedRoot = null;
      addedRootTabIndex = false;
    },
    disabledIn(root) {
      if (!root || typeof root.querySelectorAll !== 'function') return [];
      return [
        ...root.querySelectorAll<HTMLElement>(
          '[role="tab"][disabled][data-gt-tab-id]',
        ),
      ]
        .map((element) => element.dataset.gtTabId)
        .filter(
          (id): id is string =>
            typeof id === 'string' && ids.includes(id) && TAB_SAFE_ID.test(id),
        );
    },
    select(id, additionalDisabled = []) {
      const available = normalize(this, additionalDisabled);
      if (!available.includes(id)) return false;
      this.active = id;
      return true;
    },
    next(additionalDisabled = []) {
      const previousActive = this.active;
      const available = normalize(this, additionalDisabled);
      if (available.length === 0) return null;
      if (previousActive === null || !available.includes(previousActive)) {
        this.active = available[0]!;
        return this.active;
      }
      const index = available.indexOf(previousActive);
      this.active = available[(index + 1) % available.length]!;
      return this.active;
    },
    previous(additionalDisabled = []) {
      const previousActive = this.active;
      const available = normalize(this, additionalDisabled);
      if (available.length === 0) return null;
      if (previousActive === null || !available.includes(previousActive)) {
        this.active = available.at(-1)!;
        return this.active;
      }
      const index = available.indexOf(previousActive);
      this.active =
        available[(index - 1 + available.length) % available.length]!;
      return this.active;
    },
    first(additionalDisabled = []) {
      const available = enabled(additionalDisabled);
      this.active = available[0] ?? null;
      return this.active;
    },
    last(additionalDisabled = []) {
      this.active = enabled(additionalDisabled).at(-1) ?? null;
      return this.active;
    },
  };
  return state;
}

/** Options for accessible dialog lifecycle behavior. @public */
export interface DialogControllerOptions {
  /** Close on Escape unless explicitly `false`. */
  readonly closeOnEscape?: boolean;
  /** Optional selector for the preferred tabbable entry target. */
  readonly initialFocus?: string;
  /** Callback after closed state is committed and listeners are detached. */
  readonly onClose?: () => void;
  /** Callback after open state and listeners are installed, before focus entry. */
  readonly onOpen?: () => void;
  /** Default focus-restoration target. */
  readonly trigger?: HTMLElement | null;
}

/** Focus-safe dialog lifecycle controller. @public */
export interface DialogController {
  /** Whether the dialog is currently open. */
  readonly isOpen: boolean;
  /** Open once and move focus to the first valid target. */
  open(invoker?: HTMLElement | null): void;
  /** Close once, detach listeners, and restore focus unless reopened by a hook. */
  close(): void;
  /** Permanently close and release the controller; repeated calls are safe. */
  destroy(): void;
}

interface DialogAttributeSnapshot {
  readonly ariaHidden: string | null;
  readonly hadAriaHidden: boolean;
  readonly hadInert: boolean;
  readonly inert: string | null;
}

interface DialogStackEntry {
  readonly dialog: HTMLElement;
  focusEntry(): void;
}

interface DialogDocumentState {
  readonly modified: Map<Element, DialogAttributeSnapshot>;
  readonly stack: DialogStackEntry[];
}

const dialogDocumentStates = new WeakMap<Document, DialogDocumentState>();
const dialogControllerOwners = new WeakMap<HTMLElement, DialogController>();

const dialogDocumentState = (document: Document): DialogDocumentState => {
  const existing = dialogDocumentStates.get(document);
  if (existing) return existing;
  const created: DialogDocumentState = {
    modified: new Map(),
    stack: [],
  };
  dialogDocumentStates.set(document, created);
  return created;
};

const restoreDialogModality = (state: DialogDocumentState) => {
  for (const [element, snapshot] of state.modified) {
    if (snapshot.hadInert) {
      element.setAttribute('inert', snapshot.inert ?? '');
    } else {
      element.removeAttribute('inert');
    }
    if (snapshot.hadAriaHidden) {
      element.setAttribute('aria-hidden', snapshot.ariaHidden ?? '');
    } else {
      element.removeAttribute('aria-hidden');
    }
  }
  state.modified.clear();
};

const applyDialogModality = (
  document: Document,
  state: DialogDocumentState,
) => {
  const top = state.stack.at(-1);
  if (!top) return;
  let current: Element | null = top.dialog;
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const parentElement: HTMLElement | null = current.parentElement;
    if (!parentElement) break;
    for (const sibling of parentElement.children) {
      if (sibling === current || state.modified.has(sibling)) continue;
      state.modified.set(sibling, {
        ariaHidden: sibling.getAttribute('aria-hidden'),
        hadAriaHidden: sibling.hasAttribute('aria-hidden'),
        hadInert: sibling.hasAttribute('inert'),
        inert: sibling.getAttribute('inert'),
      });
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
    }
    current = parentElement;
  }
};

const transitionDialogStack = (
  document: Document,
  update: (state: DialogDocumentState) => void,
) => {
  const state = dialogDocumentState(document);
  restoreDialogModality(state);
  update(state);
  applyDialogModality(document, state);
};

const isTopDialog = (document: Document, entry: DialogStackEntry): boolean =>
  dialogDocumentState(document).stack.at(-1) === entry;

const currentTopDialog = (document: Document): DialogStackEntry | undefined =>
  dialogDocumentState(document).stack.at(-1);

/**
 * Install focus entry, trapping, Escape closing, and focus restoration.
 * Lifecycle-hook errors propagate only after the controller reconciles its DOM
 * and listener state. A destroyed controller cannot be reopened.
 *
 * @throws `TypeError` when `dialog` is not an HTML element.
 * @throws `Error` when `dialog` already has a live controller.
 * @throws `Error` when opening a destroyed controller or a lifecycle hook fails.
 * @public
 */
export function createDialogController(
  dialog: HTMLElement,
  options: DialogControllerOptions = {},
): DialogController {
  const ownerDocument = dialog?.ownerDocument;
  const HTMLElementConstructor = ownerDocument?.defaultView?.HTMLElement;
  if (
    !ownerDocument ||
    !HTMLElementConstructor ||
    !(dialog instanceof HTMLElementConstructor)
  ) {
    throw new TypeError('A dialog HTMLElement is required.');
  }
  if (dialogControllerOwners.has(dialog)) {
    throw new Error('This dialog HTMLElement already has a live controller.');
  }
  const view = ownerDocument.defaultView!;
  const ElementConstructor = view.Element;
  const NodeConstructor = view.Node;
  let opened = false;
  let destroyed = false;
  let destroying = false;
  let returnTarget: HTMLElement | null = options.trigger ?? null;
  let addedTabIndex = false;
  let redirectingFocus = false;
  let entry!: DialogStackEntry;
  let controller!: DialogController;

  const isCssHidden = (element: HTMLElement): boolean => {
    let current: HTMLElement | null = element;
    while (current && dialog.contains(current)) {
      const style = view?.getComputedStyle(current);
      if (
        style?.display === 'none' ||
        style?.visibility === 'hidden' ||
        style?.visibility === 'collapse'
      ) {
        return true;
      }
      if (current === dialog) break;
      current = current.parentElement;
    }
    return false;
  };

  const focusable = (): HTMLElement[] =>
    tabbable(dialog, { displayCheck: 'none' }).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElementConstructor &&
        element.closest('[hidden], [inert], [aria-hidden="true"]') === null &&
        !isCssHidden(element),
    );

  const focusEntry = (preferred?: HTMLElement | null) => {
    const candidates = focusable();
    const target =
      preferred && candidates.includes(preferred) ? preferred : candidates[0];
    if (target) {
      target.focus();
      return;
    }
    if (!dialog.hasAttribute('tabindex')) {
      dialog.setAttribute('tabindex', '-1');
      addedTabIndex = true;
    }
    dialog.focus();
  };

  entry = {
    dialog,
    focusEntry,
  };

  const isSafeFocusTarget = (
    target: HTMLElement | null,
  ): target is HTMLElement => {
    if (
      !target?.isConnected ||
      target.matches(':disabled') ||
      target.closest('[hidden], [inert], [aria-hidden="true"]')
    ) {
      return false;
    }
    let current: HTMLElement | null = target;
    while (current) {
      const style = view.getComputedStyle(current);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse'
      ) {
        return false;
      }
      current = current.parentElement;
    }
    return true;
  };

  const restoreFocusAfterClose = (wasTop: boolean) => {
    if (opened) return;
    const top = currentTopDialog(ownerDocument);
    const active = ownerDocument.activeElement;
    if (top) {
      if (
        active instanceof HTMLElementConstructor &&
        top.dialog.contains(active) &&
        isSafeFocusTarget(active)
      ) {
        return;
      }
      if (
        wasTop &&
        returnTarget &&
        top.dialog.contains(returnTarget) &&
        isSafeFocusTarget(returnTarget)
      ) {
        returnTarget.focus();
        return;
      }
      top.focusEntry();
      return;
    }
    if (isSafeFocusTarget(returnTarget)) returnTarget.focus();
  };

  const detach = () => {
    ownerDocument.removeEventListener('click', onDocumentClick, true);
    ownerDocument.removeEventListener('keydown', onKeyDown, true);
    ownerDocument.removeEventListener('focusin', onFocusIn, true);
  };

  const attach = () => {
    ownerDocument.addEventListener('click', onDocumentClick, true);
    ownerDocument.addEventListener('keydown', onKeyDown, true);
    ownerDocument.addEventListener('focusin', onFocusIn, true);
  };

  const close = () => {
    if (!opened) return;
    const wasTop = isTopDialog(ownerDocument, entry);
    opened = false;
    detach();
    const active = ownerDocument.activeElement;
    if (active instanceof HTMLElementConstructor && dialog.contains(active)) {
      active.blur();
    }
    transitionDialogStack(ownerDocument, (state) => {
      const index = state.stack.indexOf(entry);
      if (index >= 0) state.stack.splice(index, 1);
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    });
    let failure: unknown;
    try {
      options.onClose?.();
    } catch (error) {
      failure = error;
    }
    try {
      restoreFocusAfterClose(wasTop);
    } catch (error) {
      failure ??= error;
    }
    if (failure !== undefined) {
      throw failure instanceof Error
        ? failure
        : new Error('Dialog close lifecycle failed.', { cause: failure });
    }
  };

  const onDocumentClick = (event: MouseEvent) => {
    if (!opened || !isTopDialog(ownerDocument, entry)) return;
    const target = event.target;
    if (target instanceof NodeConstructor && dialog.contains(target)) {
      if (!(target instanceof ElementConstructor)) return;
      const closeControl = target.closest('[data-gt-dialog-close]');
      if (!closeControl) return;
      const owningDialog = closeControl.closest('[role="dialog"], dialog');
      if (owningDialog !== dialog) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    focusEntry();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!opened || !isTopDialog(ownerDocument, entry)) return;
    const target = event.target;
    const outside =
      !(target instanceof NodeConstructor) || !dialog.contains(target);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (options.closeOnEscape !== false) close();
      else if (outside) focusEntry();
      return;
    }
    if (outside) {
      event.preventDefault();
      event.stopImmediatePropagation();
      focusEntry();
      return;
    }
    if (event.key !== 'Tab') return;
    const candidates = focusable();
    if (candidates.length === 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      focusEntry();
      return;
    }
    const first = candidates[0]!;
    const last = candidates.at(-1)!;
    if (event.shiftKey && ownerDocument.activeElement === first) {
      event.preventDefault();
      event.stopImmediatePropagation();
      last.focus();
    } else if (!event.shiftKey && ownerDocument.activeElement === last) {
      event.preventDefault();
      event.stopImmediatePropagation();
      first.focus();
    }
  };

  const onFocusIn = (event: FocusEvent) => {
    if (!opened || redirectingFocus || !isTopDialog(ownerDocument, entry)) {
      return;
    }
    const target = event.target;
    if (target instanceof ElementConstructor && dialog.contains(target)) return;
    event.stopImmediatePropagation();
    redirectingFocus = true;
    try {
      focusEntry();
    } finally {
      redirectingFocus = false;
    }
  };

  controller = {
    get isOpen() {
      return opened;
    },
    open(invoker) {
      if (destroyed) {
        throw new Error('The dialog controller has been destroyed.');
      }
      if (destroying) return;
      if (opened) return;
      const active = ownerDocument.activeElement;
      const nextReturnTarget =
        invoker ??
        options.trigger ??
        (HTMLElementConstructor && active instanceof HTMLElementConstructor
          ? active
          : null);
      const preferred = options.initialFocus
        ? dialog.querySelector<HTMLElement>(options.initialFocus)
        : dialog.querySelector<HTMLElement>('[data-gt-dialog-initial-focus]');
      let needsTabIndex = false;
      returnTarget = nextReturnTarget;
      try {
        opened = true;
        transitionDialogStack(ownerDocument, (state) => {
          const existingIndex = state.stack.indexOf(entry);
          if (existingIndex >= 0) state.stack.splice(existingIndex, 1);
          state.stack.push(entry);
          dialog.hidden = false;
          dialog.setAttribute('aria-hidden', 'false');
        });
        attach();
        const candidates = focusable();
        const target =
          preferred && candidates.includes(preferred)
            ? preferred
            : candidates[0];
        needsTabIndex = !target && !dialog.hasAttribute('tabindex');
        if (needsTabIndex) {
          dialog.setAttribute('tabindex', '-1');
          addedTabIndex = true;
        }
        options.onOpen?.();
        if (opened && isTopDialog(ownerDocument, entry)) focusEntry(target);
      } catch (error) {
        const wasTop = isTopDialog(ownerDocument, entry);
        if (opened) {
          opened = false;
          detach();
          transitionDialogStack(ownerDocument, (state) => {
            const index = state.stack.indexOf(entry);
            if (index >= 0) state.stack.splice(index, 1);
            dialog.hidden = true;
            dialog.setAttribute('aria-hidden', 'true');
          });
        }
        if (needsTabIndex) {
          dialog.removeAttribute('tabindex');
          addedTabIndex = false;
        }
        try {
          restoreFocusAfterClose(wasTop);
        } catch {
          // Preserve the original lifecycle failure.
        }
        throw error instanceof Error
          ? error
          : new Error('Dialog open lifecycle failed.', { cause: error });
      }
    },
    close,
    destroy() {
      if (destroyed) return;
      destroying = true;
      let failure: unknown;
      try {
        if (opened) close();
        else {
          detach();
          transitionDialogStack(ownerDocument, (state) => {
            const index = state.stack.indexOf(entry);
            if (index >= 0) state.stack.splice(index, 1);
            dialog.hidden = true;
            dialog.setAttribute('aria-hidden', 'true');
          });
        }
      } catch (error) {
        failure = error;
      } finally {
        opened = false;
        detach();
        dialog.hidden = true;
        dialog.setAttribute('aria-hidden', 'true');
        if (addedTabIndex) dialog.removeAttribute('tabindex');
        addedTabIndex = false;
        returnTarget = null;
        destroying = false;
        destroyed = true;
        if (dialogControllerOwners.get(dialog) === controller) {
          dialogControllerOwners.delete(dialog);
        }
      }
      if (failure !== undefined) {
        throw failure instanceof Error
          ? failure
          : new Error('Dialog destroy lifecycle failed.', { cause: failure });
      }
    },
  };
  dialogControllerOwners.set(dialog, controller);
  return controller;
}

const registeredPrefixes = new WeakMap<AlpineLike, Set<string>>();

const providerName = (prefix: string, name: string): string =>
  `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;

const objectOptions = <T extends object>(value: unknown): T | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as T)
    : undefined;

/**
 * Register providers exactly once for each Alpine instance and prefix.
 *
 * @throws `TypeError` for a missing Alpine data API or a prefix that is not a
 * valid JavaScript identifier prefix.
 * @public
 */
export function registerAdminAlpine(
  alpine: AlpineLike,
  { prefix = 'gt' }: AdminAlpineRegistrationOptions = {},
): AdminAlpineRegistration {
  if (!alpine || typeof alpine.data !== 'function') {
    throw new TypeError('An Alpine instance with data() is required.');
  }
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(prefix)) {
    throw new TypeError('The Alpine provider prefix is not identifier-safe.');
  }
  const names = Object.freeze([
    providerName(prefix, 'disclosure'),
    providerName(prefix, 'dismissible'),
    providerName(prefix, 'toastStack'),
    providerName(prefix, 'tabs'),
  ]);
  const prefixes = registeredPrefixes.get(alpine) ?? new Set<string>();
  if (prefixes.has(prefix)) {
    return { registered: false, prefix, providerNames: names };
  }
  alpine.data(names[0]!, ((value: unknown) =>
    createDisclosure(
      objectOptions<DisclosureOptions>(value),
    )) as AlpineDataFactory);
  alpine.data(names[1]!, ((value: unknown) =>
    createDismissible(
      objectOptions<DismissibleOptions>(value),
    )) as AlpineDataFactory);
  alpine.data(names[2]!, ((value: unknown) =>
    createToastStack(
      Array.isArray(value) ? (value as ToastItem[]) : [],
    )) as AlpineDataFactory);
  alpine.data(names[3]!, ((
    value: unknown,
    active?: unknown,
    disabled?: unknown,
  ) =>
    createTabs(
      value as readonly string[],
      active as string | undefined,
      disabled as readonly string[] | undefined,
    )) as AlpineDataFactory);
  prefixes.add(prefix);
  registeredPrefixes.set(alpine, prefixes);
  return { registered: true, prefix, providerNames: names };
}
