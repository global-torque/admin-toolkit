import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const packageDirectory = path.resolve(import.meta.dirname, '..');
const requirementsPath = path.join(
  packageDirectory,
  'scripts',
  'requirements-django.txt',
);
const rendererPath = path.join(
  packageDirectory,
  'scripts',
  'render-django-fixtures.py',
);
const fixturesPath = path.join(
  packageDirectory,
  'fixtures',
  'django-render-cases.json',
);
const environmentDirectory = path.join(packageDirectory, '.django-venv');
const environmentMarkerPath = path.join(environmentDirectory, '.ready.json');
const bootstrapPython = process.env.PYTHON ?? 'python3';
const expectedDjangoVersion = '5.2.16';
const expectedLockedRequirements = [
  {
    requirement: 'typing_extensions==4.16.0',
    marker: 'python_version < "3.11"',
    sha256: '481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8',
  },
  {
    requirement: 'tzdata==2026.3',
    marker: 'sys_platform == "win32"',
    sha256: 'dc096730c87af6cab1b171c9d532be840741ff5d459015e7f6947bd7d7e54931',
  },
];

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: packageDirectory,
    encoding: 'utf8',
    input: options.input,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(`${command} ${args.join(' ')} failed:\n${output}`);
  }
  return result.stdout.trim();
};

const bootstrapIdentity = JSON.parse(
  run(bootstrapPython, [
    '-c',
    'import json, platform, sys; print(json.dumps({"executable": sys.executable, "implementation": platform.python_implementation(), "version": list(sys.version_info[:3])}))',
  ]),
);
if (bootstrapIdentity.implementation !== 'CPython') {
  throw new Error('The Django fixture gate requires CPython.');
}
const [pythonMajor, pythonMinor] = bootstrapIdentity.version;
if (pythonMajor !== 3 || !Number.isInteger(pythonMinor) || pythonMinor < 10) {
  throw new Error('The Django fixture gate requires CPython 3.10 or newer.');
}

const requirementsSource = fs.readFileSync(requirementsPath, 'utf8');
for (const lock of expectedLockedRequirements) {
  const expectedEntry = `${lock.requirement} ; ${lock.marker} \\\n    --hash=sha256:${lock.sha256}`;
  if (!requirementsSource.includes(expectedEntry)) {
    throw new Error(
      `The hash lock is missing conditional dependency ${lock.requirement} (${lock.marker}).`,
    );
  }
}

const requirementsSha256 = crypto
  .createHash('sha256')
  .update(requirementsSource)
  .digest('hex');
const expectedMarker = {
  bootstrap: bootstrapIdentity,
  django: expectedDjangoVersion,
  requirementsSha256,
};
let currentMarker;
try {
  currentMarker = JSON.parse(fs.readFileSync(environmentMarkerPath, 'utf8'));
} catch {
  currentMarker = undefined;
}

if (JSON.stringify(currentMarker) !== JSON.stringify(expectedMarker)) {
  fs.rmSync(environmentDirectory, { force: true, recursive: true });
  run(bootstrapPython, ['-m', 'venv', environmentDirectory]);
  const environmentPython =
    process.platform === 'win32'
      ? path.join(environmentDirectory, 'Scripts', 'python.exe')
      : path.join(environmentDirectory, 'bin', 'python');
  run(environmentPython, [
    '-m',
    'pip',
    'install',
    '--disable-pip-version-check',
    '--no-deps',
    '--only-binary=:all:',
    '--require-hashes',
    '--requirement',
    requirementsPath,
  ]);
  fs.writeFileSync(
    environmentMarkerPath,
    `${JSON.stringify(expectedMarker, null, 2)}\n`,
  );
}

const environmentPython =
  process.platform === 'win32'
    ? path.join(environmentDirectory, 'Scripts', 'python.exe')
    : path.join(environmentDirectory, 'bin', 'python');
run(environmentPython, ['-m', 'pip', 'check']);
const installedVersions = JSON.parse(
  run(environmentPython, [
    '-c',
    `import importlib.metadata, json, sys
expected = {"Django": "5.2.16", "asgiref": "3.11.1", "sqlparse": "0.5.5"}
if sys.version_info < (3, 11): expected["typing_extensions"] = "4.16.0"
if sys.platform == "win32": expected["tzdata"] = "2026.3"
print(json.dumps({name: importlib.metadata.version(name) for name in expected}, sort_keys=True))`,
  ]),
);
const expectedInstalledVersions = {
  Django: expectedDjangoVersion,
  asgiref: '3.11.1',
  sqlparse: '0.5.5',
  ...(pythonMinor < 11 ? { typing_extensions: '4.16.0' } : {}),
  ...(process.platform === 'win32' ? { tzdata: '2026.3' } : {}),
};
if (
  JSON.stringify(installedVersions) !==
  JSON.stringify(expectedInstalledVersions)
) {
  throw new Error(
    `The Django fixture environment has unexpected versions: ${JSON.stringify(installedVersions)}.`,
  );
}
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
if (
  fixtures.schemaVersion !== 1 ||
  fixtures.django !== expectedDjangoVersion ||
  !Array.isArray(fixtures.cases)
) {
  throw new Error(
    'Django render cases must use schema version 1 and the locked Django version.',
  );
}

const { adminHtmlPatterns } = await import('../dist/patterns.js');
const patternById = new Map(
  adminHtmlPatterns.map((pattern) => [pattern.id, pattern]),
);
const fixtureIds = new Set();
const cases = fixtures.cases.map((fixture) => {
  if (
    !fixture ||
    typeof fixture !== 'object' ||
    typeof fixture.id !== 'string' ||
    !fixture.context ||
    typeof fixture.context !== 'object' ||
    Array.isArray(fixture.context) ||
    typeof fixture.expected !== 'string' ||
    fixture.expected.length === 0
  ) {
    throw new Error(
      'Every Django render case needs id, context, and expected.',
    );
  }
  if (fixtureIds.has(fixture.id)) {
    throw new Error(`Duplicate Django render case: ${fixture.id}.`);
  }
  fixtureIds.add(fixture.id);
  const pattern = patternById.get(fixture.id);
  if (!pattern) {
    throw new Error(`Unknown Django render case: ${fixture.id}.`);
  }
  return {
    id: fixture.id,
    context: fixture.context,
    expected: fixture.expected,
    template: pattern.djangoFixture,
  };
});

const missingIds = [...patternById.keys()].filter((id) => !fixtureIds.has(id));
if (missingIds.length > 0 || fixtureIds.size !== patternById.size) {
  throw new Error(
    `Django render cases must cover the complete catalog; missing: ${missingIds.join(', ') || 'none'}.`,
  );
}

const result = run(environmentPython, [rendererPath], {
  input: JSON.stringify({ cases }),
});
console.info(result);
