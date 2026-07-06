import { describe, expect, it } from 'vitest';

import { adminHtmlPatterns, getAdminHtmlPattern } from './patterns';

describe('admin HTML patterns', () => {
  it('uses stable unique ids for every pattern', () => {
    const ids = adminHtmlPatterns.map((pattern) => pattern.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'alert',
      'badge',
      'button',
      'card',
      'empty-state',
      'progress',
      'status-indicator',
      'table',
      'tabs',
      'toast',
      'modal',
    ]);
  });

  it('requires implementation metadata for every pattern contract', () => {
    for (const pattern of adminHtmlPatterns) {
      expect(pattern.name.trim(), pattern.id).not.toBe('');
      expect(pattern.requiredAttributes.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.regions.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.aria.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.states.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.darkMode.trim(), pattern.id).not.toBe('');
      expect(pattern.djangoExample.trim(), pattern.id).toContain('gt-');
    }
  });

  it('records accessibility-critical attributes for interactive patterns', () => {
    expect(getAdminHtmlPattern('button').aria).toContain('Icon-only buttons require aria-label.');
    expect(getAdminHtmlPattern('table').aria).toContain('Sortable headers expose aria-sort.');
    expect(getAdminHtmlPattern('modal').requiredAttributes).toEqual(
      expect.arrayContaining(['role="dialog"', 'aria-modal="true"', 'aria-labelledby']),
    );
  });

  it('records loading, empty, and error states where admin workflows need them', () => {
    expect(getAdminHtmlPattern('table').states).toEqual(
      expect.arrayContaining(['loading', 'empty', 'error']),
    );
    expect(getAdminHtmlPattern('empty-state').states).toEqual(['empty']);
    expect(getAdminHtmlPattern('alert').states).toEqual(
      expect.arrayContaining(['error', 'success', 'loading']),
    );
  });
});
