import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import Alpine from 'alpinejs';
import axe from 'axe-core';
import { parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_PATTERN_SCHEMA_VERSION,
  UnknownAdminPatternError,
  adminBehaviorIds,
  adminHtmlPatterns,
  findAdminHtmlPattern,
  getAdminHtmlPattern,
} from './patterns.js';
import { registerAdminAlpine } from './alpine.js';
import type { AdminHtmlPattern, AlpineLike } from './types.js';

const require = createRequire(import.meta.url);
const designTokenCssPath = require.resolve('@global-torque/design-tokens/css');
const designTokenCss = fs.readFileSync(designTokenCssPath, 'utf8');
const djangoRenderCases = JSON.parse(
  fs.readFileSync(
    path.resolve(import.meta.dirname, '../fixtures/django-render-cases.json'),
    'utf8',
  ),
) as {
  readonly cases: readonly {
    readonly id: string;
    readonly expected: string;
  }[];
};

const parseErrors = (html: string): readonly string[] => {
  const errors: string[] = [];
  parseFragment(html, {
    onParseError(error) {
      errors.push(error.code);
    },
  });
  return errors;
};

const fixture = (html: string): HTMLElement => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
};

const settleAlpine = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const queryAll = (root: ParentNode, selector: string): Element[] => {
  const matches = [...root.querySelectorAll(selector)];
  for (const template of root.querySelectorAll<HTMLTemplateElement>(
    'template',
  )) {
    matches.push(...queryAll(template.content, selector));
  }
  return matches;
};

const assertIdReferences = (
  pattern: AdminHtmlPattern,
  container: HTMLElement,
  label: string,
) => {
  const identifiedElements = queryAll(container, '[id]') as HTMLElement[];
  const ids = new Map(
    identifiedElements.map((element) => [element.id, element]),
  );
  expect(ids.size, `${label}:duplicate-ids`).toBe(identifiedElements.length);

  for (const relation of pattern.idReferences) {
    const sources = queryAll(container, relation.sourceSelector);
    const targets = queryAll(container, relation.targetSelector);
    const targetSources = new Map<string, Element[]>();
    expect(sources.length, `${label}:${relation.attribute}`).toBeGreaterThan(0);
    for (const source of sources) {
      const references = (source.getAttribute(relation.attribute) ?? '')
        .split(/\s+/u)
        .filter(Boolean);
      expect(
        references.length,
        `${label}:${relation.attribute}`,
      ).toBeGreaterThan(0);
      if (relation.bijective) {
        expect(references.length, `${label}:bijective-source`).toBe(1);
      }
      for (const reference of references) {
        const target = ids.get(reference);
        expect(
          target,
          `${label}:${relation.attribute}:${reference}`,
        ).toBeDefined();
        expect(target?.matches(relation.targetSelector)).toBe(true);
        const existingSources = targetSources.get(reference) ?? [];
        if (relation.uniqueTargets || relation.bijective) {
          expect(
            existingSources,
            `${label}:unique-target:${reference}`,
          ).toEqual([]);
        }
        existingSources.push(source);
        targetSources.set(reference, existingSources);
        if (relation.reciprocalAttribute !== undefined) {
          const sourceId = (source as HTMLElement).id;
          expect(sourceId, `${label}:reciprocal-source-id`).not.toBe('');
          const reciprocalReferences = (
            target?.getAttribute(relation.reciprocalAttribute) ?? ''
          )
            .split(/\s+/u)
            .filter(Boolean);
          expect(
            reciprocalReferences,
            `${label}:reciprocal:${reference}`,
          ).toContain(sourceId);
          if (relation.bijective) {
            expect(
              reciprocalReferences,
              `${label}:bijective-reciprocal:${reference}`,
            ).toEqual([sourceId]);
          }
        }
      }
    }
    if (relation.bijective) {
      expect(sources.length, `${label}:bijective-count`).toBe(targets.length);
      for (const target of targets as HTMLElement[]) {
        expect(
          targetSources.get(target.id)?.length ?? 0,
          `${label}:bijective-target:${target.id}`,
        ).toBe(1);
      }
    }
  }

  for (const source of queryAll(
    container,
    '[aria-labelledby], [aria-describedby], [aria-controls], label[for]',
  )) {
    for (const attribute of [
      'aria-labelledby',
      'aria-describedby',
      'aria-controls',
      'for',
    ]) {
      for (const reference of (source.getAttribute(attribute) ?? '')
        .split(/\s+/u)
        .filter(Boolean)) {
        expect(ids.has(reference), `${label}:${attribute}:${reference}`).toBe(
          true,
        );
      }
    }
  }
};

const assertFixtureContract = (
  pattern: AdminHtmlPattern,
  html: string,
  label: string,
) => {
  const container = fixture(html);
  expect(parseErrors(html), label).toEqual([]);
  expect(container.children.length, label).toBe(1);
  for (const element of pattern.elements) {
    expect(
      element.region === 'root' ||
        pattern.regions.some(({ id }) => id === element.region),
      `${label}:${element.region}:region-contract`,
    ).toBe(true);
    const scopes =
      element.scopeSelector === undefined
        ? [container]
        : queryAll(container, element.scopeSelector);
    for (const [scopeIndex, scope] of scopes.entries()) {
      const nodes = queryAll(scope, element.selector);
      const scopedLabel = `${label}:${element.region}:${String(scopeIndex)}`;
      expect(nodes.length, scopedLabel).toBeGreaterThanOrEqual(
        element.minimumMatches ?? 1,
      );
      if (element.maximumMatches !== undefined) {
        expect(nodes.length, scopedLabel).toBeLessThanOrEqual(
          element.maximumMatches,
        );
      }
      for (const node of nodes) {
        expect(node.tagName.toLowerCase(), scopedLabel).toBe(element.tagName);
      }
    }
  }
  for (const attribute of pattern.requiredAttributes) {
    const nodes = queryAll(container, attribute.selector);
    expect(
      nodes.length,
      `${label}:${attribute.selector}`,
    ).toBeGreaterThanOrEqual(attribute.minimumMatches ?? 1);
    if (attribute.maximumMatches !== undefined) {
      expect(
        nodes.length,
        `${label}:${attribute.selector}:${attribute.name}`,
      ).toBeLessThanOrEqual(attribute.maximumMatches);
    }
    for (const node of nodes) {
      expect(node.hasAttribute(attribute.name)).toBe(true);
      const value = node.getAttribute(attribute.name);
      if (attribute.value !== undefined) expect(value).toBe(attribute.value);
      if (attribute.allowedValues !== undefined) {
        expect(attribute.allowedValues).toContain(value);
      }
      if (attribute.valuePattern !== undefined) {
        expect(value).toMatch(new RegExp(attribute.valuePattern, 'u'));
      }
    }
  }
  for (const region of pattern.regions) {
    const nodes = queryAll(container, region.selector);
    const minimum = region.minimumMatches ?? (region.required ? 1 : 0);
    expect(nodes.length, `${label}:${region.id}`).toBeGreaterThanOrEqual(
      minimum,
    );
    if (region.maximumMatches !== undefined) {
      expect(nodes.length, `${label}:${region.id}`).toBeLessThanOrEqual(
        region.maximumMatches,
      );
    }
    expect(
      pattern.elements.some(
        ({ region: elementRegion }) => elementRegion === region.id,
      ),
      `${label}:${region.id}:element-contract`,
    ).toBe(true);
  }
  assertIdReferences(pattern, container, label);
  return container;
};

describe('versioned admin HTML patterns', () => {
  it('exports a frozen, uniquely keyed 0.2 catalog', () => {
    const ids = adminHtmlPatterns.map(({ id }) => id);
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
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.isFrozen(adminHtmlPatterns)).toBe(true);
    for (const pattern of adminHtmlPatterns) {
      expect(pattern.schemaVersion).toBe(ADMIN_PATTERN_SCHEMA_VERSION);
      expect(Object.isFrozen(pattern), pattern.id).toBe(true);
      expect(Object.isFrozen(pattern.elements), pattern.id).toBe(true);
      expect(Object.isFrozen(pattern.djangoRenderedFixtures), pattern.id).toBe(
        true,
      );
    }
  });

  it('validates structured elements, attributes, regions, tokens, behaviors, and fixtures', () => {
    for (const pattern of adminHtmlPatterns) {
      expect(pattern.elements.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.requiredAttributes.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.regions.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.states.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.tokenReferences.length, pattern.id).toBeGreaterThan(0);
      expect(pattern.htmlFixture, pattern.id).not.toContain('{{');
      expect(pattern.djangoFixture, pattern.id).toContain('{{');
      expect(pattern.djangoFixture, pattern.id).not.toContain('|safe');
      expect(pattern.djangoRenderedFixtures.length, pattern.id).toBeGreaterThan(
        0,
      );
      const lockedDjangoOutput = djangoRenderCases.cases.find(
        ({ id }) => id === pattern.id,
      )?.expected;
      expect(
        lockedDjangoOutput,
        `${pattern.id}:locked-django-output`,
      ).toBeTypeOf('string');
      expect(pattern.djangoRenderedFixtures, pattern.id).toContain(
        lockedDjangoOutput,
      );
      assertFixtureContract(pattern, pattern.htmlFixture, `${pattern.id}:html`);
      for (const [
        index,
        rendered,
      ] of pattern.djangoRenderedFixtures.entries()) {
        expect(rendered, `${pattern.id}:django:${String(index)}`).not.toMatch(
          /\{[{%#]/u,
        );
        expect(rendered, `${pattern.id}:django:${String(index)}`).not.toBe(
          pattern.htmlFixture,
        );
        assertFixtureContract(
          pattern,
          rendered,
          `${pattern.id}:django:${String(index)}`,
        );
      }
      for (const token of pattern.tokenReferences) {
        expect(designTokenCss, `${pattern.id}:${token}`).toContain(`${token}:`);
      }
      for (const behaviorId of pattern.behaviorIds) {
        expect(adminBehaviorIds).toContain(behaviorId);
      }
    }
  });

  it('keeps every neutral fixture free of automated axe violations', async () => {
    for (const pattern of adminHtmlPatterns) {
      for (const [index, rendered] of [
        pattern.htmlFixture,
        ...pattern.djangoRenderedFixtures,
      ].entries()) {
        const container = fixture(rendered);
        document.body.replaceChildren(container);
        const result = await axe.run(container, {
          rules: { 'color-contrast': { enabled: false } },
        });
        expect(
          result.violations.map(({ id }) => id),
          `${pattern.id}:${String(index)}`,
        ).toEqual([]);
      }
    }
  });

  it('provides safe lookup for typed and untrusted identifiers', () => {
    expect(findAdminHtmlPattern('table')?.id).toBe('table');
    expect(findAdminHtmlPattern('missing')).toBeUndefined();
    expect(getAdminHtmlPattern('modal').id).toBe('modal');
    for (const value of ['missing', null, 42, Symbol('pattern'), { id: 'x' }]) {
      expect(() => getAdminHtmlPattern(value)).toThrow(
        UnknownAdminPatternError,
      );
      try {
        getAdminHtmlPattern(value);
      } catch (error) {
        expect(error).toBeInstanceOf(UnknownAdminPatternError);
        expect((error as UnknownAdminPatternError).identifier).toBe(value);
      }
    }
    try {
      getAdminHtmlPattern('rejected-pattern');
    } catch (error) {
      expect(error).toMatchObject({
        name: 'UnknownAdminPatternError',
        identifier: 'rejected-pattern',
      });
      expect((error as Error).message).toContain('rejected-pattern');
    }
  });
});

describe('adversarial pattern contract validation', () => {
  it('accepts every documented host state and bounded progress value', () => {
    const stateValues = [
      ['alert', 'data-tone="info"', ['info', 'success', 'warning', 'danger']],
      [
        'badge',
        'data-tone="neutral"',
        ['neutral', 'success', 'warning', 'danger'],
      ],
      [
        'status-indicator',
        'data-status="success"',
        ['neutral', 'success', 'warning', 'danger'],
      ],
      [
        'toast',
        'data-tone="neutral"',
        ['neutral', 'info', 'success', 'warning', 'danger'],
      ],
    ] as const;
    for (const [patternId, currentAttribute, values] of stateValues) {
      const pattern = getAdminHtmlPattern(patternId);
      for (const value of values) {
        assertFixtureContract(
          pattern,
          pattern.htmlFixture.replace(
            currentAttribute,
            currentAttribute.replace(/"[^"]*"$/u, `"${value}"`),
          ),
          `${patternId}:${value}`,
        );
      }
    }

    const progress = getAdminHtmlPattern('progress');
    for (const value of [0, 75, 100]) {
      assertFixtureContract(
        progress,
        progress.htmlFixture
          .replace('aria-valuenow="60"', `aria-valuenow="${String(value)}"`)
          .replace('width: 60%', `width: ${String(value)}%`),
        `progress:${String(value)}`,
      );
    }

    const modal = getAdminHtmlPattern('modal');
    assertFixtureContract(
      modal,
      modal.htmlFixture.replace(' hidden', ' aria-hidden="false"'),
      'modal:open',
    );
  });

  it('accepts optional alert dismissal and empty or optional-field toast outputs', async () => {
    const alert = getAdminHtmlPattern('alert');
    assertFixtureContract(
      alert,
      alert.htmlFixture.replace(
        /\s*<button data-gt-region="dismiss"[^>]*>Dismiss<\/button>/u,
        '',
      ),
      'alert:without-dismiss',
    );

    const toast = getAdminHtmlPattern('toast');
    expect(toast.htmlFixture).toContain('<template x-for="toast in toasts"');
    expect(
      toast.djangoRenderedFixtures.some((rendered) =>
        rendered.includes('x-data="gtToastStack([])"'),
      ),
    ).toBe(true);
    const emptyToast =
      '<section class="gt-toast-region" aria-label="Notifications" tabindex="-1" x-data="gtToastStack([])"></section>';
    assertFixtureContract(toast, emptyToast, 'toast:empty');

    const twoToasts = `<section class="gt-toast-region" aria-label="Notifications" tabindex="-1" x-data="gtToastStack([])">
  <div class="gt-toast" role="status" data-toast-id="one" data-tone="info"><strong data-gt-region="title">Notice</strong><p data-gt-region="message">First message</p><button data-gt-region="dismiss" type="button">Dismiss</button></div>
  <div class="gt-toast" role="status" data-toast-id="two" data-tone="neutral"><p data-gt-region="message">Second message</p><button data-gt-region="dismiss" type="button">Dismiss</button></div>
</section>`;
    const container = assertFixtureContract(
      toast,
      twoToasts,
      'toast:optional-title-tone',
    );
    document.body.replaceChildren(container);
    const result = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map(({ id }) => id)).toEqual([]);
  });

  it('hydrates an optional-tone published toast as neutral in real Alpine', async () => {
    registerAdminAlpine(Alpine as AlpineLike);
    const toast = getAdminHtmlPattern('toast');
    expect(toast.htmlFixture).toContain(
      'x-bind:data-tone="toast.tone || \'neutral\'"',
    );
    const holder = fixture(toast.djangoRenderedFixtures[0]!);
    document.body.replaceChildren(holder);
    const root = holder.firstElementChild as HTMLElement;
    Alpine.initTree(root);
    await settleAlpine();

    const hydratedToasts = root.querySelectorAll<HTMLElement>('.gt-toast');
    expect(hydratedToasts).toHaveLength(2);
    expect(hydratedToasts[1]?.dataset.tone).toBe('neutral');
    const hydratedForSchema = root.cloneNode(true) as HTMLElement;
    for (const template of hydratedForSchema.querySelectorAll('template')) {
      template.remove();
    }
    const hydratedFixture = assertFixtureContract(
      toast,
      hydratedForSchema.outerHTML,
      'toast:hydrated-optional-tone',
    );
    Alpine.destroyTree(root);
    document.body.replaceChildren(hydratedFixture);
    const result = await axe.run(hydratedFixture, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map(({ id }) => id)).toEqual([]);
    holder.remove();
  });

  it('implements every advertised optional region and still accepts omission', () => {
    const optionalRegions = [
      ['button', 'icon', '{% if icon %}'],
      ['card', 'footer', '{% if footer %}'],
      ['empty-state', 'action', '{% if action_href and action_label %}'],
      ['progress', 'label', '{% if value_label %}'],
    ] as const;

    for (const [patternId, regionId, djangoCondition] of optionalRegions) {
      const pattern = getAdminHtmlPattern(patternId);
      const region = pattern.regions.find(({ id }) => id === regionId)!;
      expect(pattern.djangoFixture, `${patternId}:django-condition`).toContain(
        djangoCondition,
      );
      expect(
        queryAll(fixture(pattern.htmlFixture), region.selector),
        `${patternId}:html:${regionId}`,
      ).toHaveLength(1);
      expect(
        queryAll(fixture(pattern.djangoRenderedFixtures[0]!), region.selector),
        `${patternId}:django:${regionId}`,
      ).toHaveLength(1);

      const withoutOptional = fixture(pattern.htmlFixture);
      queryAll(withoutOptional, region.selector)[0]?.remove();
      assertFixtureContract(
        pattern,
        withoutOptional.innerHTML,
        `${patternId}:without-${regionId}`,
      );

      const duplicated = fixture(pattern.htmlFixture);
      const optional = queryAll(duplicated, region.selector)[0]!;
      optional.parentElement?.append(optional.cloneNode(true));
      expect(() =>
        assertFixtureContract(
          pattern,
          duplicated.innerHTML,
          `${patternId}:duplicate-${regionId}`,
        ),
      ).toThrow();
    }

    const emptyState = getAdminHtmlPattern('empty-state');
    for (const unsafeHref of [
      'javascript:alert(1)',
      '//example.invalid/path',
      '/\\example.invalid/path',
    ]) {
      expect(() =>
        assertFixtureContract(
          emptyState,
          emptyState.htmlFixture.replace(
            'href="/records/new"',
            `href="${unsafeHref}"`,
          ),
          `empty-state:unsafe-action-href:${unsafeHref}`,
        ),
      ).toThrow();
    }
  });

  it('requires safe button types and hides the status decoration', () => {
    const controls = [
      ['alert', '[data-gt-region="dismiss"]'],
      ['tabs', '[role="tab"]'],
      ['toast', '[data-gt-region="dismiss"]'],
      ['modal', '[data-gt-dialog-close]'],
    ] as const;

    for (const [patternId, selector] of controls) {
      const pattern = getAdminHtmlPattern(patternId);
      const malformed = fixture(pattern.htmlFixture);
      const control = queryAll(malformed, selector)[0]!;
      expect(control.getAttribute('type'), `${patternId}:control-type`).toBe(
        'button',
      );
      control.setAttribute('type', 'submit');
      expect(() =>
        assertFixtureContract(
          pattern,
          malformed.innerHTML,
          `${patternId}:unsafe-control-type`,
        ),
      ).toThrow();
    }

    const status = getAdminHtmlPattern('status-indicator');
    const malformedStatus = status.htmlFixture.replace(
      'aria-hidden="true"',
      'aria-hidden="false"',
    );
    expect(() =>
      assertFixtureContract(
        status,
        malformedStatus,
        'status-indicator:exposed-dot',
      ),
    ).toThrow();
  });

  it('guards every tab keyboard focus lookup and preserves first-disabled state', () => {
    const tabs = getAdminHtmlPattern('tabs');
    for (const [label, source] of [
      ['html', tabs.htmlFixture],
      ['django-template', tabs.djangoFixture],
      ['django-rendered', tabs.djangoRenderedFixtures[0]!],
    ] as const) {
      const expressions = [
        ...source.matchAll(
          /x-on:keydown\.(?:right|left|home|end)\.prevent="([^"]+)"/gu,
        ),
      ].map((match) => match[1] ?? '');
      expect(expressions.length, label).toBeGreaterThanOrEqual(4);
      for (const expression of expressions) {
        expect(expression, label).toContain('active &&');
        expect(expression, label).toContain(
          "$refs['tab-' + active] && $refs['tab-' + active].focus()",
        );
      }
    }

    const rendered = tabs.djangoRenderedFixtures[0]!;
    expect(rendered).toContain(
      "x-data=\"gtTabs(['overview', 'history'], 'history', ['overview',])\"",
    );
    const container = fixture(rendered);
    expect(
      container.querySelector('[data-gt-tab-id="overview"]'),
    ).toMatchObject({ disabled: true });
    expect(
      container
        .querySelector('[data-gt-tab-id="history"]')
        ?.getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('rejects missing children on any repeated toast item', () => {
    const toast = getAdminHtmlPattern('toast');
    const malformed = `<section class="gt-toast-region" aria-label="Notifications" tabindex="-1" x-data="gtToastStack([])">
  <div class="gt-toast" role="status" data-toast-id="one" data-tone="neutral"><p data-gt-region="message">First message</p><button data-gt-region="dismiss" type="button">Dismiss</button></div>
  <div class="gt-toast" role="status" data-toast-id="two" data-tone="neutral"></div>
</section>`;
    expect(() =>
      assertFixtureContract(toast, malformed, 'toast:missing-item-children'),
    ).toThrow();
  });

  it('rejects non-bijective and non-reciprocal tab/panel references', () => {
    const tabs = getAdminHtmlPattern('tabs');
    const malformed = tabs.htmlFixture
      .replace(
        'aria-controls="gt-panel-history"',
        'aria-controls="gt-panel-overview"',
      )
      .replace(
        'aria-labelledby="gt-tab-history"',
        'aria-labelledby="gt-tab-overview"',
      );
    expect(() =>
      assertFixtureContract(tabs, malformed, 'tabs:crossed-idrefs'),
    ).toThrow();
  });

  it('models sort controls inside a form and rejects multiple aria-sort headers', () => {
    const table = getAdminHtmlPattern('table');
    const container = assertFixtureContract(
      table,
      table.htmlFixture,
      'table:form',
    );
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    for (const button of container.querySelectorAll(
      'thead button[data-gt-sort]',
    )) {
      expect(button.closest('form')).toBe(form);
    }

    const malformed = table.htmlFixture.replace(
      '<th scope="col"><button data-gt-sort',
      '<th scope="col" aria-sort="none"><button data-gt-sort',
    );
    expect(() =>
      assertFixtureContract(table, malformed, 'table:multiple-aria-sort'),
    ).toThrow();
  });
});

describe('reference styles', () => {
  it('uses only gt-prefixed selectors and resolvable public token variables', () => {
    const css = fs.readFileSync(
      path.resolve(import.meta.dirname, 'styles.css'),
      'utf8',
    );
    expect(css).toContain("@import '@global-torque/design-tokens/css';");
    const tokens = [...css.matchAll(/var\((--gt-[a-z0-9-]+)\)/gu)].map(
      (match) => match[1],
    );
    expect(tokens.length).toBeGreaterThan(20);
    const cssTokens = [...new Set(tokens)].sort();
    const catalogTokens = [
      ...new Set(
        adminHtmlPatterns.flatMap((pattern) => pattern.tokenReferences),
      ),
    ].sort();
    expect(catalogTokens).toEqual(cssTokens);
    for (const token of cssTokens) {
      expect(designTokenCss).toContain(`${String(token)}:`);
    }
    expect(css).not.toMatch(/\.(?:modal|toast|button|card|tabs)(?:\W|$)/u);

    const buildManifest = JSON.parse(
      fs.readFileSync(
        path.join(path.dirname(designTokenCssPath), 'build-manifest.json'),
        'utf8',
      ),
    ) as { files?: { 'index.css'?: string } };
    const digest = crypto
      .createHash('sha512')
      .update(designTokenCss)
      .digest('hex');
    expect(buildManifest.files?.['index.css']).toBe(digest);
  });
});
