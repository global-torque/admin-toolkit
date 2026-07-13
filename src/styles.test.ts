import { describe, expect, it } from 'vitest';

import stylesheet, { stylesheet as namedStylesheet } from './styles.js';

describe('reference stylesheet URL facade', () => {
  it('exports one stable styles.css URL through default and named bindings', () => {
    expect(stylesheet).toBe(namedStylesheet);
    expect(stylesheet).toMatch(/styles\.css(?:$|[?#])/u);
  });
});
