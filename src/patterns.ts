export type AdminPatternState =
  | 'default'
  | 'hover'
  | 'focus'
  | 'disabled'
  | 'loading'
  | 'error'
  | 'warning'
  | 'success'
  | 'empty';

export interface AdminHtmlPattern {
  id: string;
  name: string;
  requiredAttributes: readonly string[];
  regions: readonly string[];
  aria: readonly string[];
  states: readonly AdminPatternState[];
  darkMode: string;
  djangoExample: string;
}

export const adminHtmlPatterns = [
  {
    id: 'alert',
    name: 'Alert',
    requiredAttributes: ['role="status" or role="alert"', 'data-variant'],
    regions: ['icon', 'title', 'message', 'actions'],
    aria: ['Use role="alert" only for urgent errors.', 'Action buttons need visible labels.'],
    states: ['default', 'error', 'success', 'loading'],
    darkMode: 'Use token variables for surface, border, and text color.',
    djangoExample: '<div class="gt-alert" role="status" data-variant="{{ variant }}">{{ message }}</div>',
  },
  {
    id: 'badge',
    name: 'Badge',
    requiredAttributes: ['data-tone'],
    regions: ['label', 'optional icon'],
    aria: ['Use text that does not rely on color alone.'],
    states: ['default', 'success', 'error'],
    darkMode: 'Use semantic foreground/background token pairs.',
    djangoExample: '<span class="gt-badge" data-tone="{{ status }}">{{ status_label }}</span>',
  },
  {
    id: 'button',
    name: 'Button',
    requiredAttributes: ['type', 'data-variant'],
    regions: ['icon', 'label'],
    aria: ['Loading buttons set aria-busy="true".', 'Icon-only buttons require aria-label.'],
    states: ['default', 'hover', 'focus', 'disabled', 'loading'],
    darkMode: 'Keep focus rings visible against dark surfaces.',
    djangoExample: '<button class="gt-button" type="submit" data-variant="primary">{{ label }}</button>',
  },
  {
    id: 'card',
    name: 'Card',
    requiredAttributes: ['data-density'],
    regions: ['header', 'body', 'footer'],
    aria: ['Use section/article only when the card is meaningful as a landmark.'],
    states: ['default', 'loading', 'empty'],
    darkMode: 'Use surface and border tokens; do not bake product colors.',
    djangoExample: '<section class="gt-card" data-density="compact"><h2>{{ title }}</h2>{{ body }}</section>',
  },
  {
    id: 'empty-state',
    name: 'Empty State',
    requiredAttributes: ['data-size'],
    regions: ['icon', 'title', 'message', 'primary action'],
    aria: ['If loaded asynchronously, pair with aria-live on the parent region.'],
    states: ['empty'],
    darkMode: 'Use muted text and border tokens.',
    djangoExample: '<div class="gt-empty" data-size="md"><h2>{{ title }}</h2><p>{{ message }}</p></div>',
  },
  {
    id: 'progress',
    name: 'Progress',
    requiredAttributes: ['role="progressbar"', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    regions: ['track', 'bar', 'label'],
    aria: ['Include aria-valuetext when percent alone is ambiguous.'],
    states: ['default', 'loading', 'success', 'error'],
    darkMode: 'Track and bar colors use semantic token variables.',
    djangoExample: '<div class="gt-progress" role="progressbar" aria-valuenow="{{ value }}" aria-valuemin="0" aria-valuemax="100"></div>',
  },
  {
    id: 'status-indicator',
    name: 'Status Indicator',
    requiredAttributes: ['data-status'],
    regions: ['dot', 'label'],
    aria: ['Status text must be present for screen readers and visual users.'],
    states: ['default', 'success', 'warning', 'error'],
    darkMode: 'Use tone tokens with sufficient contrast.',
    djangoExample: '<span class="gt-status" data-status="{{ status }}"><span aria-hidden="true"></span>{{ label }}</span>',
  },
  {
    id: 'table',
    name: 'Table',
    requiredAttributes: ['scope on header cells'],
    regions: ['caption', 'thead', 'tbody', 'pagination', 'empty row'],
    aria: ['Use caption or aria-label for table purpose.', 'Sortable headers expose aria-sort.'],
    states: ['default', 'loading', 'empty', 'error'],
    darkMode: 'Header, row hover, border, and zebra states use token variables.',
    djangoExample: '<table class="gt-table"><caption>{{ caption }}</caption><thead>{{ headers }}</thead><tbody>{{ rows }}</tbody></table>',
  },
  {
    id: 'tabs',
    name: 'Tabs',
    requiredAttributes: ['role="tablist"', 'role="tab"', 'role="tabpanel"'],
    regions: ['tab list', 'tab trigger', 'panel'],
    aria: ['Selected tabs set aria-selected="true" and aria-controls.'],
    states: ['default', 'focus', 'disabled'],
    darkMode: 'Selected and focus states use accent and border tokens.',
    djangoExample: '<div class="gt-tabs" role="tablist">{{ tab_buttons }}</div>{{ tab_panels }}',
  },
  {
    id: 'toast',
    name: 'Toast',
    requiredAttributes: ['role="status" or role="alert"', 'data-tone'],
    regions: ['title', 'message', 'dismiss'],
    aria: ['Non-urgent toast regions use role="status"; destructive failures use role="alert".'],
    states: ['default', 'success', 'error'],
    darkMode: 'Surface and border tokens must avoid CSS collisions with Django Unfold.',
    djangoExample: '<div class="gt-toast" role="status" data-tone="{{ tone }}">{{ message }}</div>',
  },
  {
    id: 'modal',
    name: 'Modal',
    requiredAttributes: ['role="dialog"', 'aria-modal="true"', 'aria-labelledby'],
    regions: ['header', 'body', 'footer', 'close control'],
    aria: ['Focus moves into the dialog and returns to trigger on close.'],
    states: ['default', 'loading', 'error'],
    darkMode: 'Overlay, surface, and focus tokens must be configurable.',
    djangoExample: '<div class="gt-modal" role="dialog" aria-modal="true" aria-labelledby="{{ title_id }}">{{ body }}</div>',
  },
] as const satisfies readonly AdminHtmlPattern[];

export type AdminHtmlPatternId = typeof adminHtmlPatterns[number]['id'];

export function getAdminHtmlPattern(id: AdminHtmlPatternId): AdminHtmlPattern {
  return adminHtmlPatterns.find((pattern) => pattern.id === id) as AdminHtmlPattern;
}
