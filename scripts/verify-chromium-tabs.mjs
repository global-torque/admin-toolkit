import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const packageDirectory = path.resolve(import.meta.dirname, '..');
const alpineSource = fs.readFileSync(
  path.join(packageDirectory, 'dist', 'alpine.js'),
  'utf8',
);
const tabbableEntry = fileURLToPath(import.meta.resolve('tabbable'));
const tabbableSource = fs.readFileSync(
  path.join(path.dirname(tabbableEntry), 'index.esm.js'),
  'utf8',
);
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <script type="importmap">{"imports":{"tabbable":"/tabbable.js"}}</script>
  </head>
  <body>
    <div id="tabs">
      <button type="button" role="tab" data-gt-tab-id="alpha">Alpha</button>
      <button type="button" role="tab" data-gt-tab-id="beta">Beta</button>
      <button id="non-tab" type="button">Non-tab action</button>
    </div>
    <script type="module">
      import { createTabs } from '/alpine.js';
      const root = document.querySelector('#tabs');
      const state = createTabs(['alpha', 'beta']);
      state.init(root);
      window.adminTabsRegression = { root, state };
    </script>
  </body>
</html>`;

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
  if (pathname === '/alpine.js') {
    response.writeHead(200, { 'content-type': 'text/javascript' });
    response.end(alpineSource);
    return;
  }
  if (pathname === '/tabbable.js') {
    response.writeHead(200, { 'content-type': 'text/javascript' });
    response.end(tabbableSource);
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(html);
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const address = server.address();
if (!address || typeof address === 'string') {
  server.close();
  throw new Error('Chromium regression server did not expose a TCP address.');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error));

try {
  await page.goto(`http://127.0.0.1:${String(address.port)}`);
  await page.waitForFunction(() => window.adminTabsRegression !== undefined);
  await page.locator('[data-gt-tab-id="alpha"]').focus();

  const firstSynchronousActive = await page.evaluate(() => {
    const alpha = document.querySelector('[data-gt-tab-id="alpha"]');
    alpha.disabled = true;
    return document.activeElement?.tagName;
  });
  assert.equal(firstSynchronousActive, 'BODY');
  await page.waitForFunction(
    () =>
      window.adminTabsRegression.state.active === 'beta' &&
      document.activeElement?.dataset.gtTabId === 'beta',
  );

  const secondSynchronousActive = await page.evaluate(() => {
    const beta = document.querySelector('[data-gt-tab-id="beta"]');
    beta.disabled = true;
    return document.activeElement?.tagName;
  });
  assert.equal(secondSynchronousActive, 'BODY');
  await page.waitForFunction(
    () =>
      window.adminTabsRegression.state.active === null &&
      document.activeElement === window.adminTabsRegression.root,
  );

  await page.evaluate(() => {
    document.querySelector('[data-gt-tab-id="alpha"]').disabled = false;
  });
  await page.waitForFunction(
    () =>
      window.adminTabsRegression.state.active === 'alpha' &&
      document.activeElement?.dataset.gtTabId === 'alpha',
  );

  await page.reload();
  await page.waitForFunction(() => window.adminTabsRegression !== undefined);
  await page.locator('[data-gt-tab-id="alpha"]').focus();
  await page.locator('#non-tab').focus();
  await page.evaluate(() => {
    document.querySelector('[data-gt-tab-id="alpha"]').disabled = true;
  });
  await page.waitForFunction(
    () => window.adminTabsRegression.state.active === 'beta',
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    'non-tab',
  );

  await page.reload();
  await page.waitForFunction(() => window.adminTabsRegression !== undefined);
  await page.locator('[data-gt-tab-id="alpha"]').focus();
  const sameTaskSynchronousActive = await page.evaluate(() => {
    const alpha = document.querySelector('[data-gt-tab-id="alpha"]');
    alpha.disabled = true;
    const activeAfterDisable = document.activeElement?.tagName;
    alpha.disabled = false;
    return activeAfterDisable;
  });
  assert.equal(sameTaskSynchronousActive, 'BODY');
  await page.waitForFunction(
    () =>
      window.adminTabsRegression.state.active === 'alpha' &&
      document.activeElement?.dataset.gtTabId === 'alpha',
  );

  await page.reload();
  await page.waitForFunction(() => window.adminTabsRegression !== undefined);
  await page.locator('[data-gt-tab-id="alpha"]').focus();
  const explicitBlurActive = await page.evaluate(() => {
    const alpha = document.querySelector('[data-gt-tab-id="alpha"]');
    alpha.blur();
    const activeAfterBlur = document.activeElement?.tagName;
    alpha.disabled = true;
    return activeAfterBlur;
  });
  assert.equal(explicitBlurActive, 'BODY');
  await page.waitForFunction(
    () => window.adminTabsRegression.state.active === 'beta',
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    'BODY',
  );
  assert.deepEqual(pageErrors, []);
  console.log(
    JSON.stringify({
      browser: await browser.version(),
      firstSynchronousActive,
      sameTaskSynchronousActive,
      secondSynchronousActive,
      explicitBlurActive,
      status: 'passed',
    }),
  );
} finally {
  await page.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
