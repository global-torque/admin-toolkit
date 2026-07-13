import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.resolve(import.meta.dirname, '..');
const distDirectory = path.join(packageDirectory, 'dist');
fs.rmSync(distDirectory, { force: true, recursive: true });

const result = spawnSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], {
  cwd: packageDirectory,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
if (result.status !== 0) {
  throw new Error(
    `TypeScript build failed:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  );
}
for (const typeOnlyOutput of ['types.js', 'types.js.map']) {
  fs.rmSync(path.join(distDirectory, typeOnlyOutput), { force: true });
}
const { default: designTokenStylesheetUrl } =
  await import('@global-torque/design-tokens/css');
const designTokenCss = fs.readFileSync(
  fileURLToPath(designTokenStylesheetUrl),
  'utf8',
);
const referenceCss = fs.readFileSync(
  path.join(packageDirectory, 'src', 'styles.css'),
  'utf8',
);
const importStatement = "@import '@global-torque/design-tokens/css';";
if (!referenceCss.startsWith(importStatement)) {
  throw new Error('Reference styles must begin with the design-token import.');
}
fs.writeFileSync(
  path.join(distDirectory, 'styles.css'),
  `${designTokenCss.trimEnd()}\n\n${referenceCss.slice(importStatement.length).trimStart()}`,
);
