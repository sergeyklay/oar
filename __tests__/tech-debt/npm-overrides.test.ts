import { readFileSync } from 'node:fs';
import path from 'node:path';

// Registry of the `overrides` block in package.json. Every override is
// deliberate tech debt: it bridges or floors a dependency edge that upstream
// has not fixed yet. Each probe below reads the ORIGINAL manifest ranges that
// package-lock.json records for the package forcing the override (the lock
// keeps declared ranges, not the overridden ones, and covers every nested copy
// regardless of hoisting layout), and fails the moment that override becomes
// removable. A red run here means "reconcile the overrides block", never "the
// build is broken". Condition probes are used instead of dated re-checks
// because every exit condition is cheaply and deterministically checkable
// offline, so the suite only goes red when action is actually possible.

interface LockPackageEntry {
  version?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
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

    expect(Object.keys(manifest.overrides ?? {}).sort()).toEqual(['@esbuild-kit/core-utils']);
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
});
