import type {
  AdminBehaviorId,
  AdminFocusRules,
  AdminHtmlPattern,
  AdminHtmlPatternId,
  AdminPatternIdReference,
} from './types.js';

/** Schema version shared by every built-in pattern. @public */
export const ADMIN_PATTERN_SCHEMA_VERSION = '0.2.0' as const;

/** Behavior identifiers implemented by the Alpine/DOM integration. @public */
export const adminBehaviorIds = Object.freeze([
  'dialog',
  'disclosure',
  'dismissible',
  'tabs',
  'toast-stack',
] as const satisfies readonly AdminBehaviorId[]);

const passiveFocus = Object.freeze({
  initial: 'none',
  trap: false,
  returnToTrigger: false,
} as const satisfies AdminFocusRules);

type AdminPatternDefinition = Omit<
  AdminHtmlPattern,
  'djangoRenderedFixtures' | 'idReferences'
> & {
  readonly djangoRenderedFixtures: readonly [string, ...string[]];
  readonly idReferences?: readonly AdminPatternIdReference[];
};

const definePattern = ({
  djangoRenderedFixtures,
  idReferences = [],
  ...pattern
}: AdminPatternDefinition): AdminHtmlPattern => ({
  ...pattern,
  idReferences,
  djangoRenderedFixtures,
});

const toastStackFixture = (
  initialToasts: string,
): string => `<section class="gt-toast-region" aria-label="Notifications" tabindex="-1" x-data="gtToastStack(${initialToasts})">
  <template x-for="toast in toasts" x-bind:key="toast.id">
    <div class="gt-toast" role="status" data-toast-id="toast-template" data-tone="neutral" x-bind:role="toast.tone === 'danger' ? 'alert' : 'status'" x-bind:data-toast-id="toast.id" x-bind:data-tone="toast.tone || 'neutral'" x-on:keydown.escape.stop="([...$root.querySelectorAll('.gt-toast:not([hidden]) [data-gt-region=dismiss]')].find((button) => !$el.contains(button)) || $root).focus(); $el.hidden = true; remove(toast.id)">
      <template x-if="toast.title"><strong data-gt-region="title" x-text="toast.title"></strong></template>
      <p data-gt-region="message" x-text="toast.message"></p>
      <button data-gt-region="dismiss" type="button" aria-label="Dismiss notification" x-bind:aria-label="'Dismiss ' + (toast.title || 'notification')" x-on:click="([...$root.querySelectorAll('.gt-toast:not([hidden]) [data-gt-region=dismiss]')].find((button) => button !== $el) || $root).focus(); $el.closest('.gt-toast').hidden = true; remove(toast.id)">Dismiss</button>
    </div>
  </template>
</section>`;

const patterns = [
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'alert',
    name: 'Alert',
    elements: [
      { region: 'root', selector: '.gt-alert', tagName: 'div' },
      {
        region: 'title',
        selector: '[data-gt-region="title"]',
        tagName: 'strong',
      },
      {
        region: 'message',
        selector: '[data-gt-region="message"]',
        tagName: 'p',
      },
      {
        region: 'dismiss',
        selector: '[data-gt-region="dismiss"]',
        tagName: 'button',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    requiredAttributes: [
      { selector: '.gt-alert', name: 'role', value: 'status' },
      {
        selector: '.gt-alert',
        name: 'data-tone',
        allowedValues: ['info', 'success', 'warning', 'danger'],
      },
      { selector: '.gt-alert', name: 'x-data', value: 'gtDismissible' },
      {
        selector: '[data-gt-region="dismiss"]',
        name: 'aria-label',
        value: 'Dismiss notification',
        minimumMatches: 0,
        maximumMatches: 1,
      },
      {
        selector: '[data-gt-region="dismiss"]',
        name: 'type',
        value: 'button',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    regions: [
      { id: 'title', selector: '[data-gt-region="title"]', required: true },
      {
        id: 'message',
        selector: '[data-gt-region="message"]',
        required: true,
      },
      {
        id: 'dismiss',
        selector: '[data-gt-region="dismiss"]',
        required: false,
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    states: [
      { id: 'info', attribute: 'data-tone="info"' },
      { id: 'success', attribute: 'data-tone="success"' },
      { id: 'warning', attribute: 'data-tone="warning"' },
      { id: 'error', attribute: 'data-tone="danger"' },
    ],
    tokenReferences: [
      '--gt-color-background-surface',
      '--gt-color-foreground-default',
      '--gt-color-border-default',
      '--gt-color-positive-background',
      '--gt-color-positive-border',
      '--gt-color-positive-foreground',
      '--gt-color-warning-background',
      '--gt-color-warning-border',
      '--gt-color-warning-foreground',
      '--gt-color-negative-background',
      '--gt-color-negative-border',
      '--gt-color-negative-foreground',
      '--gt-primitive-duration-fast',
      '--gt-primitive-easing-standard',
      '--gt-primitive-radius-md',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [
      { key: 'Enter', action: 'Activate dismiss button', target: 'dismiss' },
    ],
    focus: passiveFocus,
    behaviorIds: ['dismissible'],
    htmlFixture: `<div class="gt-alert" role="status" data-tone="info" x-data="gtDismissible" x-show="visible">
  <strong data-gt-region="title">Account notice</strong>
  <p data-gt-region="message">Review the latest account information.</p>
  <button data-gt-region="dismiss" type="button" aria-label="Dismiss notification" x-on:click="dismiss">Dismiss</button>
</div>`,
    djangoFixture: `<div class="gt-alert" role="status" data-tone="{{ tone|default:'info' }}" x-data="gtDismissible" x-show="visible">
  <strong data-gt-region="title">{{ title }}</strong>
  <p data-gt-region="message">{{ message }}</p>
  {% if dismissible %}<button data-gt-region="dismiss" type="button" aria-label="Dismiss notification" x-on:click="dismiss">{{ dismiss_label|default:'Dismiss' }}</button>{% endif %}
</div>`,
    djangoRenderedFixtures: [
      `<div class="gt-alert" role="status" data-tone="warning" x-data="gtDismissible" x-show="visible">
  <strong data-gt-region="title">Review &lt;account&gt;</strong>
  <p data-gt-region="message">Owner&#x27;s email &amp; phone</p>
  <button data-gt-region="dismiss" type="button" aria-label="Dismiss notification" x-on:click="dismiss">Close</button>
</div>`,
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'badge',
    name: 'Badge',
    elements: [
      { region: 'root', selector: '.gt-badge', tagName: 'span' },
      {
        region: 'label',
        selector: '[data-gt-region="label"]',
        tagName: 'span',
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-badge',
        name: 'data-tone',
        allowedValues: ['neutral', 'success', 'warning', 'danger'],
      },
    ],
    regions: [
      { id: 'label', selector: '[data-gt-region="label"]', required: true },
    ],
    states: [
      { id: 'neutral', attribute: 'data-tone="neutral"' },
      { id: 'success', attribute: 'data-tone="success"' },
      { id: 'warning', attribute: 'data-tone="warning"' },
      { id: 'danger', attribute: 'data-tone="danger"' },
    ],
    tokenReferences: [
      '--gt-color-neutral-background',
      '--gt-color-neutral-foreground',
      '--gt-color-positive-background',
      '--gt-color-positive-border',
      '--gt-color-positive-foreground',
      '--gt-color-warning-background',
      '--gt-color-warning-border',
      '--gt-color-warning-foreground',
      '--gt-color-negative-background',
      '--gt-color-negative-border',
      '--gt-color-negative-foreground',
      '--gt-primitive-font-size-sm',
      '--gt-primitive-radius-full',
      '--gt-primitive-spacing-1',
      '--gt-primitive-spacing-2',
    ],
    keyboard: [],
    focus: passiveFocus,
    behaviorIds: [],
    htmlFixture:
      '<span class="gt-badge" data-tone="neutral"><span data-gt-region="label">Pending</span></span>',
    djangoFixture:
      '<span class="gt-badge" data-tone="{{ tone|default:\'neutral\' }}"><span data-gt-region="label">{{ label }}</span></span>',
    djangoRenderedFixtures: [
      '<span class="gt-badge" data-tone="success"><span data-gt-region="label">Approved &amp; verified</span></span>',
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'button',
    name: 'Button',
    elements: [
      { region: 'root', selector: '.gt-button', tagName: 'button' },
      {
        region: 'icon',
        selector: '[data-gt-region="icon"]',
        tagName: 'span',
        minimumMatches: 0,
        maximumMatches: 1,
      },
      {
        region: 'label',
        selector: '[data-gt-region="label"]',
        tagName: 'span',
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-button',
        name: 'type',
        allowedValues: ['button', 'submit', 'reset'],
      },
      { selector: '.gt-button', name: 'data-variant', value: 'primary' },
      {
        selector: '[data-gt-region="icon"]',
        name: 'aria-hidden',
        value: 'true',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    regions: [
      {
        id: 'icon',
        selector: '[data-gt-region="icon"]',
        required: false,
        minimumMatches: 0,
        maximumMatches: 1,
      },
      { id: 'label', selector: '[data-gt-region="label"]', required: true },
    ],
    states: [
      { id: 'default' },
      { id: 'hover', attribute: 'data-state="hover"' },
      { id: 'focus', attribute: 'data-state="focus"' },
      { id: 'disabled', attribute: 'disabled' },
      { id: 'loading', attribute: 'aria-busy="true"' },
    ],
    tokenReferences: [
      '--gt-component-button-primary-background',
      '--gt-component-button-primary-background-hover',
      '--gt-component-button-primary-foreground',
      '--gt-component-button-focus-ring',
      '--gt-component-button-disabled-background',
      '--gt-component-button-disabled-foreground',
      '--gt-primitive-duration-fast',
      '--gt-primitive-easing-standard',
      '--gt-primitive-font-weight-medium',
      '--gt-primitive-radius-md',
      '--gt-primitive-spacing-2',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [
      { key: 'Enter', action: 'Activate button', target: 'root' },
      { key: 'Space', action: 'Activate button', target: 'root' },
    ],
    focus: {
      initial: 'root when invoked by keyboard navigation',
      trap: false,
      returnToTrigger: false,
    },
    behaviorIds: [],
    htmlFixture:
      '<button class="gt-button" type="button" data-variant="primary"><span data-gt-region="icon" aria-hidden="true">✓</span><span data-gt-region="label">Save changes</span></button>',
    djangoFixture:
      '<button class="gt-button" type="{{ button_type|default:\'button\' }}" data-variant="{{ variant|default:\'primary\' }}"{% if disabled %} disabled{% endif %}>{% if icon %}<span data-gt-region="icon" aria-hidden="true">{{ icon }}</span>{% endif %}<span data-gt-region="label">{{ label }}</span></button>',
    djangoRenderedFixtures: [
      '<button class="gt-button" type="submit" data-variant="primary" disabled><span data-gt-region="icon" aria-hidden="true">✓</span><span data-gt-region="label">Save &amp; continue</span></button>',
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'card',
    name: 'Card',
    elements: [
      { region: 'root', selector: '.gt-card', tagName: 'section' },
      {
        region: 'heading',
        selector: '[data-gt-region="heading"]',
        tagName: 'h2',
      },
      {
        region: 'body',
        selector: '[data-gt-region="body"]',
        tagName: 'div',
      },
      {
        region: 'footer',
        selector: '[data-gt-region="footer"]',
        tagName: 'footer',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-card',
        name: 'aria-labelledby',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*-title$',
      },
      {
        selector: '.gt-card',
        name: 'data-density',
        allowedValues: ['comfortable', 'compact'],
      },
      {
        selector: '[data-gt-region="heading"]',
        name: 'id',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*-title$',
      },
    ],
    regions: [
      { id: 'heading', selector: '[data-gt-region="heading"]', required: true },
      { id: 'body', selector: '[data-gt-region="body"]', required: true },
      {
        id: 'footer',
        selector: '[data-gt-region="footer"]',
        required: false,
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    states: [
      { id: 'default' },
      { id: 'loading', attribute: 'aria-busy="true"' },
      { id: 'empty', attribute: 'data-state="empty"' },
    ],
    tokenReferences: [
      '--gt-color-background-surface',
      '--gt-color-border-default',
      '--gt-color-foreground-default',
      '--gt-primitive-radius-md',
      '--gt-primitive-shadow-sm',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [],
    focus: passiveFocus,
    behaviorIds: [],
    idReferences: [
      {
        sourceSelector: '.gt-card',
        attribute: 'aria-labelledby',
        targetSelector: '[data-gt-region="heading"]',
      },
    ],
    htmlFixture: `<section class="gt-card" aria-labelledby="gt-card-title" data-density="comfortable">
  <h2 id="gt-card-title" data-gt-region="heading">Account summary</h2>
  <div data-gt-region="body"><p>No action is required.</p></div>
  <footer data-gt-region="footer">Updated moments ago</footer>
</section>`,
    djangoFixture: `<section class="gt-card" aria-labelledby="{{ card_id }}-title" data-density="{{ density|default:'comfortable' }}">
  <h2 id="{{ card_id }}-title" data-gt-region="heading">{{ title }}</h2>
  <div data-gt-region="body">{{ body }}</div>
  {% if footer %}<footer data-gt-region="footer">{{ footer }}</footer>{% endif %}
</section>`,
    djangoRenderedFixtures: [
      `<section class="gt-card" aria-labelledby="account-card-title" data-density="compact">
  <h2 id="account-card-title" data-gt-region="heading">Account summary</h2>
  <div data-gt-region="body">&lt;p&gt;No action is required.&lt;/p&gt;</div>
  <footer data-gt-region="footer">Updated moments ago</footer>
</section>`,
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'empty-state',
    name: 'Empty state',
    elements: [
      { region: 'root', selector: '.gt-empty-state', tagName: 'section' },
      {
        region: 'heading',
        selector: '[data-gt-region="heading"]',
        tagName: 'h2',
      },
      {
        region: 'message',
        selector: '[data-gt-region="message"]',
        tagName: 'p',
      },
      {
        region: 'action',
        selector: '[data-gt-region="action"]',
        tagName: 'a',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-empty-state',
        name: 'aria-labelledby',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*-title$',
      },
      {
        selector: '[data-gt-region="heading"]',
        name: 'id',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*-title$',
      },
      {
        selector: '[data-gt-region="action"]',
        name: 'href',
        valuePattern: '^(?:/(?!/)|\\./|\\.\\./|#|\\?)[^\\s\\\\]*$',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    regions: [
      { id: 'heading', selector: '[data-gt-region="heading"]', required: true },
      { id: 'message', selector: '[data-gt-region="message"]', required: true },
      {
        id: 'action',
        selector: '[data-gt-region="action"]',
        required: false,
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    states: [{ id: 'empty', attribute: 'data-state="empty"' }],
    tokenReferences: [
      '--gt-color-background-subtle',
      '--gt-color-background-surface',
      '--gt-color-border-default',
      '--gt-color-foreground-default',
      '--gt-color-foreground-muted',
      '--gt-primitive-radius-md',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [],
    focus: passiveFocus,
    behaviorIds: [],
    idReferences: [
      {
        sourceSelector: '.gt-empty-state',
        attribute: 'aria-labelledby',
        targetSelector: '[data-gt-region="heading"]',
      },
    ],
    htmlFixture: `<section class="gt-empty-state" id="gt-empty-state" aria-labelledby="gt-empty-title" data-state="empty">
  <h2 id="gt-empty-title" data-gt-region="heading">No records yet</h2>
  <p data-gt-region="message">Create a record to begin.</p>
  <a data-gt-region="action" href="/records/new">Create record</a>
</section>`,
    djangoFixture: `<section class="gt-empty-state" id="{{ empty_id }}" aria-labelledby="{{ empty_id }}-title" data-state="empty">
  <h2 id="{{ empty_id }}-title" data-gt-region="heading">{{ title }}</h2>
  <p data-gt-region="message">{{ message }}</p>
  {% if action_href and action_label %}<a data-gt-region="action" href="{{ action_href }}">{{ action_label }}</a>{% endif %}
</section>`,
    djangoRenderedFixtures: [
      `<section class="gt-empty-state" id="records-empty" aria-labelledby="records-empty-title" data-state="empty">
  <h2 id="records-empty-title" data-gt-region="heading">No records yet</h2>
  <p data-gt-region="message">Create a record to begin.</p>
  <a data-gt-region="action" href="/records/new">Create record</a>
</section>`,
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'progress',
    name: 'Progress',
    elements: [
      { region: 'root', selector: '.gt-progress-group', tagName: 'div' },
      { region: 'track', selector: '.gt-progress', tagName: 'div' },
      {
        region: 'bar',
        selector: '[data-gt-region="bar"]',
        tagName: 'span',
      },
      {
        region: 'label',
        selector: '[data-gt-region="label"]',
        tagName: 'span',
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    requiredAttributes: [
      { selector: '.gt-progress', name: 'role', value: 'progressbar' },
      { selector: '.gt-progress', name: 'aria-valuemin', value: '0' },
      { selector: '.gt-progress', name: 'aria-valuemax', value: '100' },
      {
        selector: '.gt-progress',
        name: 'aria-valuenow',
        valuePattern: '^(?:100|[1-9]?[0-9])$',
      },
      {
        selector: '.gt-progress',
        name: 'aria-label',
        valuePattern: '^\\S(?:.*\\S)?$',
      },
    ],
    regions: [
      { id: 'track', selector: '.gt-progress', required: true },
      { id: 'bar', selector: '[data-gt-region="bar"]', required: true },
      {
        id: 'label',
        selector: '[data-gt-region="label"]',
        required: false,
        minimumMatches: 0,
        maximumMatches: 1,
      },
    ],
    states: [
      { id: 'loading', attribute: 'data-state="loading"' },
      { id: 'complete', attribute: 'data-state="complete"' },
      { id: 'error', attribute: 'data-state="error"' },
    ],
    tokenReferences: [
      '--gt-color-background-subtle',
      '--gt-color-accent-background',
      '--gt-primitive-radius-full',
      '--gt-primitive-spacing-2',
    ],
    keyboard: [],
    focus: passiveFocus,
    behaviorIds: [],
    htmlFixture:
      '<div class="gt-progress-group"><div class="gt-progress" role="progressbar" aria-label="Import progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"><span data-gt-region="bar" style="width: 60%"></span></div><span data-gt-region="label">60%</span></div>',
    djangoFixture:
      '<div class="gt-progress-group"><div class="gt-progress" role="progressbar" aria-label="{{ label }}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{ value }}"><span data-gt-region="bar" style="width: {{ value }}%"></span></div>{% if value_label %}<span data-gt-region="label">{{ value_label }}</span>{% endif %}</div>',
    djangoRenderedFixtures: [
      '<div class="gt-progress-group"><div class="gt-progress" role="progressbar" aria-label="Import progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="67"><span data-gt-region="bar" style="width: 67%"></span></div><span data-gt-region="label">67%</span></div>',
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'status-indicator',
    name: 'Status indicator',
    elements: [
      { region: 'root', selector: '.gt-status', tagName: 'span' },
      {
        region: 'dot',
        selector: '[data-gt-region="dot"]',
        tagName: 'span',
      },
      {
        region: 'label',
        selector: '[data-gt-region="label"]',
        tagName: 'span',
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-status',
        name: 'data-status',
        allowedValues: ['neutral', 'success', 'warning', 'danger'],
      },
      { selector: '.gt-status', name: 'role', value: 'status' },
      {
        selector: '[data-gt-region="dot"]',
        name: 'aria-hidden',
        value: 'true',
      },
    ],
    regions: [
      { id: 'dot', selector: '[data-gt-region="dot"]', required: true },
      { id: 'label', selector: '[data-gt-region="label"]', required: true },
    ],
    states: [
      { id: 'neutral', attribute: 'data-status="neutral"' },
      { id: 'success', attribute: 'data-status="success"' },
      { id: 'warning', attribute: 'data-status="warning"' },
      { id: 'danger', attribute: 'data-status="danger"' },
    ],
    tokenReferences: [
      '--gt-color-positive-background',
      '--gt-color-positive-border',
      '--gt-color-positive-foreground',
      '--gt-color-warning-background',
      '--gt-color-warning-border',
      '--gt-color-warning-foreground',
      '--gt-color-negative-background',
      '--gt-color-negative-border',
      '--gt-color-negative-foreground',
      '--gt-primitive-radius-full',
      '--gt-primitive-spacing-1',
      '--gt-primitive-spacing-2',
    ],
    keyboard: [],
    focus: passiveFocus,
    behaviorIds: [],
    htmlFixture:
      '<span class="gt-status" data-status="success" role="status"><span data-gt-region="dot" aria-hidden="true"></span><span data-gt-region="label">Active</span></span>',
    djangoFixture:
      '<span class="gt-status" data-status="{{ status }}" role="status"><span data-gt-region="dot" aria-hidden="true"></span><span data-gt-region="label">{{ label }}</span></span>',
    djangoRenderedFixtures: [
      '<span class="gt-status" data-status="danger" role="status"><span data-gt-region="dot" aria-hidden="true"></span><span data-gt-region="label">Action required</span></span>',
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'table',
    name: 'Data table',
    elements: [
      { region: 'root', selector: '.gt-table-form', tagName: 'form' },
      { region: 'table', selector: '.gt-table', tagName: 'table' },
      { region: 'caption', selector: 'caption', tagName: 'caption' },
      { region: 'head', selector: 'thead', tagName: 'thead' },
      { region: 'body', selector: 'tbody', tagName: 'tbody' },
      {
        region: 'sort',
        selector: 'thead button[data-gt-sort]',
        tagName: 'button',
        minimumMatches: 2,
      },
    ],
    requiredAttributes: [
      { selector: '.gt-table-form', name: 'method', value: 'get' },
      {
        selector: '.gt-table-form',
        name: 'aria-label',
        valuePattern: '^\\S(?:.*\\S)?$',
      },
      {
        selector: 'thead th',
        name: 'scope',
        value: 'col',
        minimumMatches: 2,
      },
      {
        selector: 'thead th[aria-sort]',
        name: 'aria-sort',
        allowedValues: ['none', 'ascending', 'descending', 'other'],
        minimumMatches: 0,
        maximumMatches: 1,
      },
      {
        selector: 'thead button[data-gt-sort]',
        name: 'type',
        value: 'submit',
        minimumMatches: 2,
      },
      {
        selector: 'thead button[data-gt-sort]',
        name: 'name',
        value: 'sort',
        minimumMatches: 2,
      },
      {
        selector: 'thead button[data-gt-sort]',
        name: 'value',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*$',
        minimumMatches: 2,
      },
    ],
    regions: [
      { id: 'table', selector: '.gt-table', required: true },
      { id: 'caption', selector: 'caption', required: true },
      { id: 'head', selector: 'thead', required: true },
      { id: 'body', selector: 'tbody', required: true },
      {
        id: 'sort',
        selector: 'thead button[data-gt-sort]',
        required: true,
        minimumMatches: 2,
      },
    ],
    states: [
      { id: 'default' },
      { id: 'loading', attribute: 'aria-busy="true"' },
      { id: 'empty', attribute: 'data-state="empty"' },
      { id: 'error', attribute: 'data-state="error"' },
    ],
    tokenReferences: [
      '--gt-color-background-surface',
      '--gt-color-background-subtle',
      '--gt-color-border-default',
      '--gt-color-foreground-default',
      '--gt-primitive-spacing-3',
    ],
    keyboard: [
      {
        key: 'Enter',
        action: 'Activate host-provided server sort action',
        target: 'column header button',
      },
    ],
    focus: passiveFocus,
    behaviorIds: [],
    htmlFixture: `<form class="gt-table-form" method="get" aria-label="Sort recent records">
  <table class="gt-table">
    <caption>Recent records</caption>
    <thead><tr><th scope="col" aria-sort="ascending"><button data-gt-sort type="submit" name="sort" value="name">Name</button></th><th scope="col"><button data-gt-sort type="submit" name="sort" value="status">Status</button></th></tr></thead>
    <tbody><tr><th scope="row">Example record</th><td>Active</td></tr></tbody>
  </table>
</form>`,
    djangoFixture: `<form class="gt-table-form" method="get" aria-label="{{ sort_label }}">
  <table class="gt-table">
    <caption>{{ caption }}</caption>
    <thead><tr>{% for column in columns %}<th scope="col"{% if column.aria_sort %} aria-sort="{{ column.aria_sort }}"{% endif %}><button data-gt-sort type="submit" name="sort" value="{{ column.id }}">{{ column.label }}</button></th>{% endfor %}</tr></thead>
    <tbody>{% for row in rows %}<tr>{% for cell in row %}<td>{{ cell }}</td>{% endfor %}</tr>{% empty %}<tr><td colspan="{{ columns|length }}">{{ empty_label }}</td></tr>{% endfor %}</tbody>
  </table>
</form>`,
    djangoRenderedFixtures: [
      `<form class="gt-table-form" method="get" aria-label="Sort recent records">
  <table class="gt-table">
    <caption>Recent records</caption>
    <thead><tr><th scope="col" aria-sort="descending"><button data-gt-sort type="submit" name="sort" value="name">Name</button></th><th scope="col"><button data-gt-sort type="submit" name="sort" value="status">Status</button></th></tr></thead>
    <tbody><tr><td colspan="2">No records</td></tr></tbody>
  </table>
</form>`,
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'tabs',
    name: 'Tabs',
    elements: [
      { region: 'root', selector: '.gt-tabs', tagName: 'div' },
      { region: 'tablist', selector: '[role="tablist"]', tagName: 'div' },
      {
        region: 'tab',
        selector: '[role="tab"]',
        tagName: 'button',
        minimumMatches: 2,
      },
      {
        region: 'panel',
        selector: '[role="tabpanel"]',
        tagName: 'section',
        minimumMatches: 2,
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-tabs',
        name: 'x-data',
        valuePattern: '^gtTabs\\(',
      },
      {
        selector: '[role="tablist"]',
        name: 'aria-label',
        valuePattern: '^\\S(?:.*\\S)?$',
      },
      {
        selector: '[role="tab"]',
        name: 'aria-selected',
        allowedValues: ['true', 'false'],
        minimumMatches: 2,
      },
      {
        selector: '[role="tab"]',
        name: 'type',
        value: 'button',
        minimumMatches: 2,
      },
      {
        selector: '[role="tab"]',
        name: 'data-gt-tab-id',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*$',
        minimumMatches: 2,
      },
      {
        selector: '[role="tab"]',
        name: 'aria-controls',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*panel-[A-Za-z0-9_-]+$',
        minimumMatches: 2,
      },
      {
        selector: '[role="tabpanel"]',
        name: 'aria-labelledby',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*tab-[A-Za-z0-9_-]+$',
        minimumMatches: 2,
      },
    ],
    regions: [
      { id: 'tablist', selector: '[role="tablist"]', required: true },
      {
        id: 'tab',
        selector: '[role="tab"]',
        required: true,
        minimumMatches: 2,
      },
      {
        id: 'panel',
        selector: '[role="tabpanel"]',
        required: true,
        minimumMatches: 2,
      },
    ],
    states: [
      { id: 'selected', attribute: 'aria-selected="true"' },
      { id: 'unselected', attribute: 'aria-selected="false"' },
      { id: 'disabled', attribute: 'disabled' },
    ],
    tokenReferences: [
      '--gt-color-accent-background',
      '--gt-color-border-default',
      '--gt-color-border-focus',
      '--gt-color-foreground-default',
      '--gt-color-foreground-muted',
      '--gt-primitive-spacing-2',
      '--gt-primitive-spacing-3',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [
      { key: 'ArrowRight', action: 'Select next enabled tab', target: 'tab' },
      {
        key: 'ArrowLeft',
        action: 'Select previous enabled tab',
        target: 'tab',
      },
      { key: 'Home', action: 'Select first enabled tab', target: 'tab' },
      { key: 'End', action: 'Select last enabled tab', target: 'tab' },
    ],
    focus: {
      initial: 'selected tab',
      trap: false,
      returnToTrigger: false,
    },
    behaviorIds: ['tabs'],
    idReferences: [
      {
        sourceSelector: '[role="tab"]',
        attribute: 'aria-controls',
        targetSelector: '[role="tabpanel"]',
        uniqueTargets: true,
        reciprocalAttribute: 'aria-labelledby',
        bijective: true,
      },
    ],
    htmlFixture: `<div class="gt-tabs" x-data="gtTabs(['overview', 'history'])">
  <div role="tablist" aria-label="Record sections">
    <button id="gt-tab-overview" type="button" role="tab" data-gt-tab-id="overview" aria-selected="true" aria-controls="gt-panel-overview" x-ref="tab-overview" x-bind:aria-selected="active === 'overview'" x-bind:tabindex="active === 'overview' ? 0 : -1" x-on:click="select('overview', disabledIn($root))" x-on:keydown.right.prevent="next(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.left.prevent="previous(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.home.prevent="first(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.end.prevent="last(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())">Overview</button>
    <button id="gt-tab-history" type="button" role="tab" data-gt-tab-id="history" aria-selected="false" aria-controls="gt-panel-history" tabindex="-1" x-ref="tab-history" x-bind:aria-selected="active === 'history'" x-bind:tabindex="active === 'history' ? 0 : -1" x-on:click="select('history', disabledIn($root))" x-on:keydown.right.prevent="next(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.left.prevent="previous(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.home.prevent="first(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.end.prevent="last(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())">History</button>
  </div>
  <section id="gt-panel-overview" role="tabpanel" aria-labelledby="gt-tab-overview" x-show="active === 'overview'" x-bind:hidden="active !== 'overview'">Overview content</section>
  <section id="gt-panel-history" role="tabpanel" aria-labelledby="gt-tab-history" hidden x-show="active === 'history'" x-bind:hidden="active !== 'history'">History content</section>
</div>`,
    djangoFixture: `<div class="gt-tabs" x-data="gtTabs([{% for tab in tabs %}'{{ tab.id|escapejs }}'{% if not forloop.last %}, {% endif %}{% endfor %}], '{{ active_tab_id|escapejs }}', [{% for tab in tabs %}{% if tab.disabled %}'{{ tab.id|escapejs }}',{% endif %}{% endfor %}])">
  <div role="tablist" aria-label="{{ tabs_label }}">{% for tab in tabs %}<button id="{{ tabs_id }}-tab-{{ tab.id }}" type="button" role="tab" data-gt-tab-id="{{ tab.id }}" aria-selected="{% if tab.id == active_tab_id %}true{% else %}false{% endif %}" aria-controls="{{ tabs_id }}-panel-{{ tab.id }}"{% if tab.id != active_tab_id %} tabindex="-1"{% endif %}{% if tab.disabled %} disabled{% endif %} x-ref="tab-{{ tab.id }}" x-bind:aria-selected="active === '{{ tab.id|escapejs }}'" x-bind:tabindex="active === '{{ tab.id|escapejs }}' ? 0 : -1" x-on:click="select('{{ tab.id|escapejs }}', disabledIn($root))" x-on:keydown.right.prevent="next(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.left.prevent="previous(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.home.prevent="first(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.end.prevent="last(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())">{{ tab.label }}</button>{% endfor %}</div>
  {% for tab in tabs %}<section id="{{ tabs_id }}-panel-{{ tab.id }}" role="tabpanel" aria-labelledby="{{ tabs_id }}-tab-{{ tab.id }}"{% if tab.id != active_tab_id %} hidden{% endif %} x-show="active === '{{ tab.id|escapejs }}'" x-bind:hidden="active !== '{{ tab.id|escapejs }}'">{{ tab.content }}</section>{% endfor %}
</div>`,
    djangoRenderedFixtures: [
      `<div class="gt-tabs" x-data="gtTabs(['overview', 'history'], 'history', ['overview',])">
  <div role="tablist" aria-label="Record sections"><button id="record-tabs-tab-overview" type="button" role="tab" data-gt-tab-id="overview" aria-selected="false" aria-controls="record-tabs-panel-overview" tabindex="-1" disabled x-ref="tab-overview" x-bind:aria-selected="active === 'overview'" x-bind:tabindex="active === 'overview' ? 0 : -1" x-on:click="select('overview', disabledIn($root))" x-on:keydown.right.prevent="next(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.left.prevent="previous(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.home.prevent="first(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.end.prevent="last(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())">Overview</button><button id="record-tabs-tab-history" type="button" role="tab" data-gt-tab-id="history" aria-selected="true" aria-controls="record-tabs-panel-history" x-ref="tab-history" x-bind:aria-selected="active === 'history'" x-bind:tabindex="active === 'history' ? 0 : -1" x-on:click="select('history', disabledIn($root))" x-on:keydown.right.prevent="next(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.left.prevent="previous(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.home.prevent="first(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())" x-on:keydown.end.prevent="last(disabledIn($root)); $nextTick(() => active && $refs['tab-' + active] && $refs['tab-' + active].focus())">History</button></div>
  <section id="record-tabs-panel-overview" role="tabpanel" aria-labelledby="record-tabs-tab-overview" hidden x-show="active === 'overview'" x-bind:hidden="active !== 'overview'">Overview &amp; summary</section><section id="record-tabs-panel-history" role="tabpanel" aria-labelledby="record-tabs-tab-history" x-show="active === 'history'" x-bind:hidden="active !== 'history'">&lt;strong&gt;No history&lt;/strong&gt;</section>
</div>`,
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'toast',
    name: 'Toast stack',
    elements: [
      { region: 'root', selector: '.gt-toast-region', tagName: 'section' },
      {
        region: 'toast',
        selector: '.gt-toast',
        tagName: 'div',
        minimumMatches: 0,
      },
      {
        region: 'title',
        selector: '[data-gt-region="title"]',
        tagName: 'strong',
        scopeSelector: '.gt-toast',
        minimumMatches: 0,
        maximumMatches: 1,
      },
      {
        region: 'message',
        selector: '[data-gt-region="message"]',
        tagName: 'p',
        scopeSelector: '.gt-toast',
        minimumMatches: 1,
        maximumMatches: 1,
      },
      {
        region: 'dismiss',
        selector: '[data-gt-region="dismiss"]',
        tagName: 'button',
        scopeSelector: '.gt-toast',
        minimumMatches: 1,
        maximumMatches: 1,
      },
    ],
    requiredAttributes: [
      {
        selector: '.gt-toast-region',
        name: 'aria-label',
        value: 'Notifications',
      },
      { selector: '.gt-toast-region', name: 'tabindex', value: '-1' },
      {
        selector: '.gt-toast-region',
        name: 'x-data',
        valuePattern: '^gtToastStack\\(',
      },
      {
        selector: '.gt-toast',
        name: 'role',
        allowedValues: ['status', 'alert'],
        minimumMatches: 0,
      },
      {
        selector: '.gt-toast',
        name: 'data-toast-id',
        valuePattern: '^[A-Za-z0-9][A-Za-z0-9_-]*$',
        minimumMatches: 0,
      },
      {
        selector: '.gt-toast',
        name: 'data-tone',
        allowedValues: ['neutral', 'info', 'success', 'warning', 'danger'],
        minimumMatches: 0,
      },
      {
        selector: '[data-gt-region="dismiss"]',
        name: 'type',
        value: 'button',
        minimumMatches: 0,
      },
    ],
    regions: [
      {
        id: 'toast',
        selector: '.gt-toast',
        required: false,
        minimumMatches: 0,
      },
      {
        id: 'title',
        selector: '[data-gt-region="title"]',
        required: false,
        minimumMatches: 0,
      },
      {
        id: 'message',
        selector: '[data-gt-region="message"]',
        required: false,
        minimumMatches: 0,
      },
      {
        id: 'dismiss',
        selector: '[data-gt-region="dismiss"]',
        required: false,
        minimumMatches: 0,
      },
    ],
    states: [
      { id: 'neutral', attribute: 'data-tone="neutral"' },
      { id: 'info', attribute: 'data-tone="info"' },
      { id: 'success', attribute: 'data-tone="success"' },
      { id: 'warning', attribute: 'data-tone="warning"' },
      { id: 'danger', attribute: 'data-tone="danger"' },
    ],
    tokenReferences: [
      '--gt-color-background-surface',
      '--gt-color-border-default',
      '--gt-color-foreground-default',
      '--gt-color-positive-border',
      '--gt-color-negative-border',
      '--gt-color-warning-border',
      '--gt-component-toast-positive-background',
      '--gt-component-toast-positive-foreground',
      '--gt-component-toast-negative-background',
      '--gt-component-toast-negative-foreground',
      '--gt-component-toast-neutral-background',
      '--gt-component-toast-neutral-foreground',
      '--gt-color-warning-background',
      '--gt-color-warning-foreground',
      '--gt-primitive-duration-fast',
      '--gt-primitive-easing-standard',
      '--gt-primitive-radius-md',
      '--gt-primitive-shadow-md',
      '--gt-primitive-spacing-2',
      '--gt-primitive-spacing-3',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [
      { key: 'Escape', action: 'Dismiss focused toast', target: 'toast' },
    ],
    focus: passiveFocus,
    behaviorIds: ['toast-stack'],
    htmlFixture: toastStackFixture(
      "[{ id: 'saved', title: 'Saved', message: 'The record was updated.', tone: 'success' }]",
    ),
    djangoFixture: toastStackFixture(
      "[{% for toast in toasts %}{ id: '{{ toast.id|escapejs }}', message: '{{ toast.message|escapejs }}'{% if toast.title %}, title: '{{ toast.title|escapejs }}'{% endif %}{% if toast.tone %}, tone: '{{ toast.tone|escapejs }}'{% endif %} }{% if not forloop.last %}, {% endif %}{% endfor %}]",
    ),
    djangoRenderedFixtures: [
      toastStackFixture(
        "[{ id: 'notice', message: 'Review this record.', title: 'Notice', tone: 'info' }, { id: 'queued', message: 'The job is queued.' }]",
      ),
      toastStackFixture('[]'),
    ],
  }),
  definePattern({
    schemaVersion: ADMIN_PATTERN_SCHEMA_VERSION,
    id: 'modal',
    name: 'Modal dialog',
    elements: [
      { region: 'root', selector: '.gt-dialog', tagName: 'div' },
      {
        region: 'heading',
        selector: '[data-gt-region="heading"]',
        tagName: 'h2',
      },
      {
        region: 'body',
        selector: '[data-gt-region="body"]',
        tagName: 'div',
      },
      {
        region: 'footer',
        selector: '[data-gt-region="footer"]',
        tagName: 'div',
      },
      {
        region: 'close',
        selector: '[data-gt-dialog-close]',
        tagName: 'button',
      },
    ],
    requiredAttributes: [
      { selector: '.gt-dialog', name: 'role', value: 'dialog' },
      { selector: '.gt-dialog', name: 'aria-modal', value: 'true' },
      {
        selector: '.gt-dialog',
        name: 'aria-labelledby',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*-title$',
      },
      {
        selector: '.gt-dialog[hidden]',
        name: 'hidden',
        minimumMatches: 0,
        maximumMatches: 1,
      },
      {
        selector: '[data-gt-region="heading"]',
        name: 'id',
        valuePattern: '^[A-Za-z][A-Za-z0-9_-]*-title$',
      },
      {
        selector: '[data-gt-dialog-close]',
        name: 'aria-label',
        value: 'Close dialog',
      },
      {
        selector: '[data-gt-dialog-close]',
        name: 'type',
        value: 'button',
      },
    ],
    regions: [
      { id: 'heading', selector: '[data-gt-region="heading"]', required: true },
      { id: 'body', selector: '[data-gt-region="body"]', required: true },
      { id: 'footer', selector: '[data-gt-region="footer"]', required: true },
      { id: 'close', selector: '[data-gt-dialog-close]', required: true },
    ],
    states: [
      { id: 'closed', attribute: 'hidden' },
      { id: 'open', attribute: 'aria-hidden="false"' },
      { id: 'loading', attribute: 'aria-busy="true"' },
      { id: 'error', attribute: 'data-state="error"' },
    ],
    tokenReferences: [
      '--gt-color-background-surface',
      '--gt-color-border-default',
      '--gt-component-dialog-background',
      '--gt-component-dialog-foreground',
      '--gt-component-dialog-overlay',
      '--gt-color-border-focus',
      '--gt-color-foreground-default',
      '--gt-primitive-duration-fast',
      '--gt-primitive-easing-standard',
      '--gt-primitive-radius-md',
      '--gt-primitive-shadow-md',
      '--gt-primitive-spacing-4',
    ],
    keyboard: [
      {
        key: 'Escape',
        action: 'Close when escape closing is enabled',
        target: 'dialog',
      },
      {
        key: 'Tab',
        action: 'Cycle within focusable dialog controls',
        target: 'dialog',
      },
      {
        key: 'Shift+Tab',
        action: 'Cycle backward within dialog controls',
        target: 'dialog',
      },
    ],
    focus: {
      initial: '[data-gt-dialog-initial-focus], then first focusable control',
      trap: true,
      returnToTrigger: true,
    },
    behaviorIds: ['dialog'],
    idReferences: [
      {
        sourceSelector: '.gt-dialog',
        attribute: 'aria-labelledby',
        targetSelector: '[data-gt-region="heading"]',
      },
    ],
    htmlFixture: `<div class="gt-dialog" role="dialog" aria-modal="true" aria-labelledby="gt-dialog-title" hidden>
  <h2 id="gt-dialog-title" data-gt-region="heading">Confirm change</h2>
  <div data-gt-region="body"><p>This action updates the record.</p></div>
  <div data-gt-region="footer"><button type="button" data-gt-dialog-initial-focus>Confirm</button><button type="button" data-gt-dialog-close aria-label="Close dialog">Cancel</button></div>
</div>`,
    djangoRenderedFixtures: [
      `<div class="gt-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" hidden>
  <h2 id="confirm-dialog-title" data-gt-region="heading">Confirm change</h2>
  <div data-gt-region="body">&lt;p&gt;This action updates the record.&lt;/p&gt;</div>
  <div data-gt-region="footer"><button type="submit" data-gt-dialog-initial-focus>Confirm &amp; save</button><button type="button" data-gt-dialog-close aria-label="Close dialog">Cancel</button></div>
</div>`,
    ],
    djangoFixture: `<div class="gt-dialog" role="dialog" aria-modal="true" aria-labelledby="{{ dialog_id }}-title" hidden>
  <h2 id="{{ dialog_id }}-title" data-gt-region="heading">{{ title }}</h2>
  <div data-gt-region="body">{{ body }}</div>
  <div data-gt-region="footer"><button type="submit" data-gt-dialog-initial-focus>{{ confirm_label }}</button><button type="button" data-gt-dialog-close aria-label="Close dialog">{{ cancel_label|default:'Cancel' }}</button></div>
</div>`,
  }),
] as const satisfies readonly AdminHtmlPattern[];

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

/** Deeply frozen built-in pattern catalog. @public */
export const adminHtmlPatterns: readonly AdminHtmlPattern[] =
  deepFreeze(patterns);

const patternById = new Map(
  adminHtmlPatterns.map((pattern) => [pattern.id, pattern]),
);

/** Error thrown when a runtime pattern identifier is unknown. @public */
export class UnknownAdminPatternError extends Error {
  /** Exact rejected runtime value, retained without coercing object input. */
  readonly identifier: unknown;

  constructor(value: unknown) {
    const description =
      value === null
        ? 'null'
        : typeof value === 'bigint'
          ? `${value.toString()}n`
          : ['string', 'number', 'boolean', 'undefined'].includes(typeof value)
            ? JSON.stringify(value)
            : typeof value === 'symbol'
              ? value.description === undefined
                ? 'Symbol()'
                : `Symbol(${JSON.stringify(value.description)})`
              : '[object value]';
    super(`Unknown admin HTML pattern identifier: ${description}.`);
    this.name = 'UnknownAdminPatternError';
    this.identifier = value;
  }
}

/** Find a pattern by untrusted string identifier. @public */
export function findAdminHtmlPattern(id: string): AdminHtmlPattern | undefined {
  return patternById.get(id as AdminHtmlPatternId);
}

/** Return a pattern or throw for any invalid runtime input. @public */
export function getAdminHtmlPattern(id: unknown): AdminHtmlPattern {
  const pattern = typeof id === 'string' ? findAdminHtmlPattern(id) : undefined;
  if (!pattern) throw new UnknownAdminPatternError(id);
  return pattern;
}
