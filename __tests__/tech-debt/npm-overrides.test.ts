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

// Sentinel: every package that still declares a deprecated glob 10.x range, and
// the range it declares. Read from package-lock.json, which records the original
// declared ranges - the "glob" override does not rewrite them.
const GLOB_10_DEPENDENTS: Record<string, string> = {
  '@jest/reporters': '^10.5.0',
  'jest-config': '^10.5.0',
  'jest-runtime': '^10.5.0',
  'test-exclude': '^10.4.1',
};

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
      'babel-plugin-istanbul',
      'glob',
      'jsdom',
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

  // WHY: @jest/transform pins `babel-plugin-istanbul: ^7.0.1`, and 7.0.1 pulls
  // test-exclude 6, which pulls the deprecated glob 7 and through it the
  // abandoned, memory-leaking inflight 1.0.6. That is two of the six deprecation
  // warnings `npm ci` printed before this override. babel-plugin-istanbul 8
  // moved to test-exclude 7 and drops both. Jest 30.4.2 is the latest release
  // and still declares ^7.0.1, so there is no in-range bump to take instead -
  // `npm update babel-plugin-istanbul` cannot cross the major on its own.
  // Verified with the override in place: `npm run test:coverage` exits 0 with
  // 1521 tests passing AND writes coverage/lcov.info, which proves the
  // instrumentation path actually ran rather than being skipped - a plain
  // `npm test` never loads this plugin and would have been a green result that
  // could not fail.
  // EXIT: @jest/transform stops declaring the ^7 range, in particular once it
  // starts admitting babel-plugin-istanbul 8 or newer.
  // ACTION on failure: if the new range admits 8.x, delete the
  // "babel-plugin-istanbul" key from package.json overrides, run
  // `npm install`, confirm `npm ls inflight glob --all` reports neither
  // inflight nor a glob below 11, then delete this probe and drop it from the
  // registry list above. Otherwise keep the override and update the sentinel.
  it('jest still pins babel-plugin-istanbul to the deprecated-glob major', () => {
    for (const entry of lockEntriesFor('@jest/transform')) {
      expect(entry.dependencies?.['babel-plugin-istanbul']).toBe('^7.0.1');
    }
  });

  // WHY: glob 10 is deprecated wholesale upstream - the registry moved it to the
  // "legacy-v10" dist-tag and every install of it warns. Three Jest packages and
  // test-exclude still declare a 10.x range, so without this override `npm ci`
  // warns on glob@10.5.0. glob has kept a stable named-export surface since v9
  // (`glob`, `globSync`, `globStream`, `Glob`), which is all Jest consumes via
  // `require("glob")` in @jest/reporters, jest-config and jest-runtime, so
  // forcing 13 is a floor bump rather than an API change. glob 13 also restores
  // Node 18 support that 11 and 12 dropped, so it does not narrow this project's
  // runtime range. Verified with the override in place: test, test:coverage,
  // lint, typecheck and build all exit 0.
  // EXIT: every dependent stops declaring a 10.x range.
  // ACTION on failure: this fires when a dependent moves OR when a new package
  // enters the tree declaring glob. If GLOB_10_DEPENDENTS is now empty, delete
  // the "glob" key from package.json overrides, run `npm install`, confirm
  // `npm ls glob --all` shows nothing below 11, then delete both glob probes
  // and drop the key from the registry list above. If only some dependents
  // moved, update GLOB_10_DEPENDENTS to the new ranges and keep the override.
  it('every glob dependent still declares a deprecated 10.x range', () => {
    for (const [dependent, range] of Object.entries(GLOB_10_DEPENDENTS)) {
      for (const entry of lockEntriesFor(dependent)) {
        expect(entry.dependencies?.glob).toBe(range);
      }
    }
  });

  // WHY: unlike every other key here, the glob override is unscoped - it applies
  // to the whole tree, present and future. A package that arrives later and
  // declares glob would be silently forced onto 13 with nobody having checked
  // that it survives the jump. This probe bounds the blast radius by asserting
  // the set of dependents is exactly the audited one.
  // EXIT: never - permanent scaffolding for as long as the glob override stands.
  // ACTION on failure: a new package declares glob. Check whether it works on
  // glob 13; if yes, add it to GLOB_10_DEPENDENTS, if no, narrow the override
  // from an unscoped key to per-dependent nested keys.
  it('no package outside the audited set declares glob', () => {
    const dependents = Object.entries(readLock().packages)
      .filter(([, entry]) => entry.dependencies?.glob !== undefined)
      .map(([key]) => key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length));

    expect([...new Set(dependents)].sort()).toEqual(Object.keys(GLOB_10_DEPENDENTS).sort());
  });

  // WHY: jest-environment-jsdom 30.4.1 declares `jsdom: ^26.1.0`, and jsdom 26
  // and 27 depend on whatwg-encoding, which upstream deprecated in favour of
  // @exodus/bytes. jsdom 28 completed that swap, so any jsdom at or above 28
  // clears the warning. jest-environment-jsdom 30.4.1 is the latest release and
  // still declares ^26.1.0, so there is no in-range bump to take instead.
  // The override tracks the current major, ^30. It is coupled to the Node pin:
  // jsdom 30 requires Node "^22.22.2 || ^24.15.0 || >=26.0.0", so it installs
  // clean only while .tool-versions stays at or above 24.15.0 - it pins 24.19.0.
  // Dropping the Node pin below that floor would trade this deprecation warning
  // for an EBADENGINE warning, which is a lateral move, not a fix; the probe
  // below guards that. Verified with the override in place: `npm test` exits 0
  // with 1527 tests passing, every DOM-rendering suite included.
  // EXIT: jest-environment-jsdom stops declaring the ^26 range, in particular
  // once it starts admitting jsdom 28 or newer.
  // ACTION on failure: if the new range admits >=28, delete the "jsdom" key from
  // package.json overrides, run `npm install`, confirm `npm ls whatwg-encoding`
  // reports nothing, then delete this probe and drop it from the registry list
  // above. Otherwise keep the override and update the sentinel.
  it('jest-environment-jsdom still pins jsdom to a whatwg-encoding major', () => {
    for (const entry of lockEntriesFor('jest-environment-jsdom')) {
      expect(entry.dependencies?.jsdom).toBe('^26.1.0');
    }
  });

  // WHY: the jsdom override and the nodejs pin are coupled, and nothing else in
  // the repository records that. jsdom 30 declares engines
  // "^22.22.2 || ^24.15.0 || >=26.0.0"; drop .tool-versions below 24.15.0 and
  // `npm ci` starts printing EBADENGINE for jsdom instead of the deprecation
  // warning the override removed. That is a lateral move, and it would surface
  // as a Node change rather than a dependency one, so nobody would connect the
  // two. This probe forces the connection.
  // EXIT: never - permanent scaffolding for as long as the jsdom override stands.
  // ACTION on failure: if the pin dropped inside major 24, either restore it to
  // 24.15.0 or newer or lower the "jsdom" override to ^29.0.0, the newest jsdom
  // that installs clean on Node 24.0-24.14. If the pin moved to a different Node
  // major, re-read jsdom's `engines` field - majors 23 and 25 satisfy no part of
  // it - and update both this probe and the override to match.
  it('the nodejs pin still satisfies the jsdom engine floor', () => {
    const toolVersions = readFileSync(path.join(process.cwd(), '.tool-versions'), 'utf8');
    const pinned = /^nodejs[ \t]+(\d+)\.(\d+)\.\d+/m.exec(toolVersions);

    expect(pinned).not.toBeNull();
    expect(Number(pinned?.[1])).toBe(24);
    expect(Number(pinned?.[2])).toBeGreaterThanOrEqual(15);
  });
});
