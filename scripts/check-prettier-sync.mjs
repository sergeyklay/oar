#!/usr/bin/env node
/**
 * Prettier Toolchain Drift Guard
 *
 * Fails when the installed Prettier differs from the one package-lock.json
 * pins. A stale node_modules is silent: `npm run format` still succeeds, but
 * it rewrites files with the wrong Prettier, and formatting rules change
 * between releases. The result is a file that CI rejects, committed by a
 * developer whose local run reported success.
 *
 * This guard runs automatically before `format` and `format:check` via npm's
 * pre-script convention.
 *
 * Usage: node scripts/check-prettier-sync.mjs
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getLogger } from './logger.mjs';

const logger = getLogger('PrettierSyncCheck');

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const lockedVersion = readJson(join(ROOT_DIR, 'package-lock.json')).packages?.[
  'node_modules/prettier'
]?.version;

if (!lockedVersion) {
  logger.error('package-lock.json has no entry for node_modules/prettier; cannot verify toolchain');
  process.exit(1);
}

let installedVersion;
try {
  installedVersion = readJson(join(ROOT_DIR, 'node_modules/prettier/package.json')).version;
} catch {
  logger.error({ lockedVersion }, 'Prettier is not installed. Run `npm ci` before formatting');
  process.exit(1);
}

if (installedVersion !== lockedVersion) {
  logger.error(
    { installedVersion, lockedVersion },
    'Installed Prettier does not match package-lock.json. Formatting now would ' +
      'rewrite files with the wrong version and fail CI. Run `npm ci` first',
  );
  process.exit(1);
}
