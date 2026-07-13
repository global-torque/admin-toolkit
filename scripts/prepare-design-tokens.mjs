import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const packageDirectory = path.resolve(import.meta.dirname, '..');
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
);
const dependencyName = '@global-torque/design-tokens';
const requiredVersion = '0.1.0-beta.3';
const dependencySpecifier = packageManifest.devDependencies?.[dependencyName];
const reviewedTarballName = `global-torque-design-tokens-${requiredVersion}.tgz`;
const isReviewedTarball =
  typeof dependencySpecifier === 'string' &&
  dependencySpecifier.startsWith('file:') &&
  path.basename(dependencySpecifier.slice('file:'.length)) ===
    reviewedTarballName;

if (dependencySpecifier !== requiredVersion && !isReviewedTarball) {
  throw new Error(
    `${dependencyName} must use exact version ${requiredVersion} or its exact reviewed tarball.`,
  );
}

let resolvedStyles;
try {
  resolvedStyles = require.resolve(`${dependencyName}/css`);
} catch (error) {
  throw new Error(
    `${dependencyName}@${requiredVersion} is not installed. Install the exact reviewed artifact; sibling-source fallback is intentionally unsupported.`,
    { cause: error },
  );
}

let installedDirectory = path.dirname(resolvedStyles);
let installedManifest;
while (installedDirectory !== path.dirname(installedDirectory)) {
  const candidate = path.join(installedDirectory, 'package.json');
  if (fs.existsSync(candidate)) {
    const manifest = JSON.parse(fs.readFileSync(candidate, 'utf8'));
    if (manifest.name === dependencyName) {
      installedManifest = manifest;
      break;
    }
  }
  installedDirectory = path.dirname(installedDirectory);
}

if (!installedManifest || installedManifest.version !== requiredVersion) {
  throw new Error(
    `${dependencyName}@${requiredVersion} is required; resolved ${installedManifest?.version ?? 'an unidentifiable package'}.`,
  );
}

if (!fs.existsSync(resolvedStyles)) {
  throw new Error(`${dependencyName}/css resolved to a missing file.`);
}
