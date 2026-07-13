import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const packageDirectory = path.resolve(import.meta.dirname, '..');
const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'admin-toolkit-api-docs-'),
);

const targets = [
  { input: 'temp/root', committed: 'docs/api', temporary: 'api' },
  {
    input: 'temp/styles',
    committed: 'docs/api-styles',
    temporary: 'api-styles',
  },
];

const canonicalDocument = (contents) =>
  `${contents
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd()}\n`;

const snapshot = (directory) =>
  Object.fromEntries(
    fs
      .readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => [
        entry.name,
        canonicalDocument(
          fs.readFileSync(path.join(directory, entry.name), 'utf8'),
        ),
      ])
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  );

try {
  for (const target of targets) {
    const temporaryDirectory = path.join(temporaryRoot, target.temporary);
    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'api-documenter',
        'markdown',
        '--input',
        target.input,
        '--output',
        temporaryDirectory,
      ],
      {
        cwd: packageDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        `API Documenter failed for ${target.input}:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
      );
    }
    const committed = path.join(packageDirectory, target.committed);
    if (
      !fs.existsSync(committed) ||
      JSON.stringify(snapshot(temporaryDirectory)) !==
        JSON.stringify(snapshot(committed))
    ) {
      throw new Error(`${target.committed} is stale; run pnpm run docs:api.`);
    }
  }
  for (const report of [
    'etc/admin-toolkit.api.md',
    'etc/admin-toolkit-styles.api.md',
  ]) {
    const contents = fs.readFileSync(
      path.join(packageDirectory, report),
      'utf8',
    );
    if (contents.includes('(undocumented)')) {
      throw new Error(`${report} contains undocumented public API members.`);
    }
  }
  console.info('Generated admin-toolkit API documentation is current.');
} finally {
  fs.rmSync(temporaryRoot, { force: true, recursive: true });
}
