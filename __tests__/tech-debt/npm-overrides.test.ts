// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Registry of the `overrides` block in package.json. Every override is
// deliberate tech debt: it bridges or floors a dependency edge that upstream
// has not fixed yet. Each probe below reads what package-lock.json records
// for the package forcing the override - the ORIGINAL manifest ranges (the
// lock keeps declared ranges, not the overridden ones, and covers every
// nested copy regardless of hoisting layout), or the resolved version where
// a pin must hold - and fails the moment that override becomes removable. A
// red run here means "reconcile the overrides block", never "the build is
// broken". Condition probes are used instead of dated re-checks because
// every exit condition is cheaply and deterministically checkable offline,
// so the suite only goes red when action is actually possible.

interface LockPackageEntry {
  version?: string;
  dependencies?: Record<string, string>;
}

function readLock(): { packages: Record<string, LockPackageEntry> } {
  const lockPath = path.join(process.cwd(), 'package-lock.json');
  return JSON.parse(readFileSync(lockPath, 'utf8')) as {
    packages: Record<string, LockPackageEntry>;
  };
}

function lockEntriesFor(packageName: string): LockPackageEntry[] {
  const suffix = `node_modules/${packageName}`;
  const entries = Object.entries(readLock().packages)
    .filter(([key]) => key === suffix || key.endsWith(`/${suffix}`))
    .map(([, entry]) => entry);
  if (entries.length === 0) {
    throw new Error(
      `${packageName} is no longer in package-lock.json - re-evaluate the ` +
        'related key in package.json overrides and prune it if nothing needs it',
    );
  }
  return entries;
}

describe('tech-debt tripwire: npm overrides registry', () => {
  // WHY: this asserts the overrides block has not grown behind the tripwires'
  // back. Every key here must have a probe below explaining why it exists and
  // when it can go. An override added without a probe is undocumented debt
  // that nobody will ever remember to remove.
  // EXIT: never - this probe is permanent scaffolding.
  // ACTION on failure: if a key was ADDED, write a probe for it in this file
  // (WHY / EXIT / ACTION) and add it to the list below. If a key was REMOVED,
  // delete its probe and drop it from the list.
  it('contains exactly the documented set of overrides', () => {
    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      overrides?: Record<string, unknown>;
    };

    expect(Object.keys(manifest.overrides ?? {}).sort()).toEqual([
      '@esbuild-kit/core-utils',
      'eslint-plugin-react-hooks',
    ]);
  });

  // WHY: drizzle-kit depends on the deprecated @esbuild-kit/esm-loader (merged
  // into tsx upstream), which pulls @esbuild-kit/core-utils, which declares
  // `esbuild: ~0.18.20`. esbuild <=0.24.2 carries GHSA-67mh-4wv8-2f99, so
  // without the override a vulnerable esbuild 0.18.20 is installed nested under
  // @esbuild-kit/core-utils - verified by deleting the key and re-resolving in
  // a scratch copy. The advisory is MODERATE and the package is dev-only, so
  // the CI gate (`npm audit --omit=dev --audit-level=high`) never catches it:
  // this override is the ONLY guard, which is why it is a keep rather than a
  // cosmetic leftover. drizzle-kit 0.31.10 is the latest release and still
  // declares @esbuild-kit/esm-loader, so there is no upstream fix to adopt yet.
  // EXIT: @esbuild-kit/core-utils stops declaring the sentinel range, in
  // particular once it starts admitting esbuild 0.25 or newer.
  // ACTION on failure: if the new range admits esbuild >=0.25.0, delete the
  // "@esbuild-kit/core-utils" key from package.json overrides, run
  // `npm install`, confirm no esbuild copy below 0.25.0 remains via
  // `npm ls esbuild --all`, then delete this probe; otherwise keep the override
  // and update the sentinel to the new range.
  it('esbuild floor override is still required by @esbuild-kit/core-utils', () => {
    for (const entry of lockEntriesFor('@esbuild-kit/core-utils')) {
      expect(entry.dependencies?.esbuild).toBe('~0.18.20');
    }
  });

  // WHY: the override above only matters while drizzle-kit keeps dragging the
  // deprecated @esbuild-kit chain into the tree. If drizzle-kit drops
  // @esbuild-kit/esm-loader, the whole chain leaves and the override becomes
  // dead weight. This probe watches the upstream edge rather than the symptom,
  // so the debt is retired as soon as drizzle-kit fixes it.
  //
  // The edge is vestigial: drizzle-kit 0.31.10 DECLARES @esbuild-kit/esm-loader
  // but never imports it. Verified by grepping the whole installed package -
  // "esbuild-kit" matches node_modules/drizzle-kit/package.json only, while the
  // positive control "brocli" matches both package.json and bin.cjs. The chain
  // is therefore dead weight on disk that npm still installs, which is why
  // `npm ci` prints two deprecation warnings that no override can remove
  // (overrides can re-point a dependency, never delete one). drizzle-kit
  // 1.0.0-rc.4 replaces the whole loader path with jiti and drops the chain,
  // but it is a release candidate of the migration generator and drizzle-orm is
  // held at ^0.45.2, so adopting it is not a trade worth making for two
  // cosmetic warnings.
  // EXIT: drizzle-kit stops declaring @esbuild-kit/esm-loader.
  // ACTION on failure: run `npm ls @esbuild-kit/core-utils`. If nothing pulls
  // it any more, delete the "@esbuild-kit/core-utils" key from package.json
  // overrides, run `npm install`, and delete both this probe and the esbuild
  // probe above.
  it('drizzle-kit still pulls the deprecated @esbuild-kit chain', () => {
    for (const entry of lockEntriesFor('drizzle-kit')) {
      expect(entry.dependencies?.['@esbuild-kit/esm-loader']).toBeDefined();
    }
  });

  // WHY: eslint-config-next ^16.3.4 declares eslint-plugin-react-hooks ^7.0.0,
  // and lockfile regeneration resolves that range to 7.1.1. The 7.1.1 release
  // changed the set-state-in-effect detection, so `npm run lint` fails on
  // pre-existing production components the migration must not modify. The pin
  // is exact ("7.0.1", not a range) because any range floats back to 7.1.1 on
  // regeneration; it holds the transitive plugin at the last release whose
  // detection passes the repository's lint, the same proven-requirement class
  // as the @esbuild-kit/core-utils override above.
  // EXIT: an eslint-plugin-react-hooks release above 7.0.1 whose
  // set-state-in-effect detection passes `npm run lint` on the production
  // components. Verify by deleting the pin, running `npm install`, and
  // linting before retiring the override.
  // ACTION on failure: the resolved version has left the pin. Restore the
  // "eslint-plugin-react-hooks": "7.0.1" key in package.json overrides and
  // run `npm install`; if `npm run lint` passes on the newer version, retire
  // the debt instead - delete the override key, this probe, and the key's
  // entry in the registry list above. A pin deliberately moved to a different
  // lint-clean release updates the sentinel here.
  it('eslint-plugin-react-hooks pin still holds the lockfile at 7.0.1', () => {
    for (const entry of lockEntriesFor('eslint-plugin-react-hooks')) {
      expect(entry.version).toBe('7.0.1');
    }
  });
});
