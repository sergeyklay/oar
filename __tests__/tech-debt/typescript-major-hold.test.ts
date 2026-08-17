import { readFileSync } from 'node:fs';
import path from 'node:path';

// `typescript` is held on the 6.x line and Dependabot is configured to skip its
// major updates (.github/dependabot.yml). TypeScript 7.x is the native Go port:
// it ships no JavaScript compiler API at all. Its package exports map "." to
// `lib/version.cjs`, which exports only `version` and `versionMajorMinor`; the
// replacement API lives behind `./unstable/*` subpaths with a different shape.
// The published `bin` field carries `tsc` alone - `tsserver` is not shipped.
//
// This breaks linting, and ONLY linting. Verified empirically against
// typescript@7.0.2 in this repository:
//
//   npm run lint       -> exit 2, crashes before linting a single file
//   npm run typecheck  -> exit 0
//   npm run test       -> exit 0 (1520 tests)
//   npm run build      -> exit 0, but see the caveat below
//
// The lint crash is mechanical, not a rule failure. `typescript-eslint` reaches
// this project transitively through `eslint-config-next`, and
// @typescript-eslint/typescript-estree evaluates `ts.Extension.Cjs` at module
// load time (create-program/shared.js). Under TypeScript 7 `require('typescript')`
// resolves to `version.cjs`, so `ts.Extension` is `undefined` and the import
// throws `TypeError: Cannot read properties of undefined (reading 'Cjs')`.
// ESLint exits 2 before any file is parsed.
//
// Note that the symptom will change without the blocker changing. Since 8.65.0
// typescript-eslint ships an explicit guard - `if (versionMajor >= 7) throw` -
// that replaces the raw TypeError with a clear message. The copy installed here
// is 8.57.2 (pinned by eslint-config-next) and predates it, so this project
// still sees the TypeError. A friendlier error is not progress.
//
// There is no version to upgrade to. The latest release (typescript-eslint
// 8.67.0) and even the canary (8.67.1-alpha.4) both declare
// `typescript: ">=4.8.4 <6.1.0"`, which excludes 7.x outright. Upstream tracks
// this in typescript-eslint#10940, explicitly scoped to "TS >=7.1": TypeScript
// 7.0 ships no stable programmatic API at all, so there is nothing for them to
// build on yet. Microsoft's 7.1 iteration plan (microsoft/TypeScript#63703)
// targets API stabilisation - including the Language Service API - for 7.1
// stable on 2026-11-10.
//
// BUILD CAVEAT: `next build` passing under 7.x is not evidence that the
// ecosystem is ready. It works because Next.js 16.3.1 defaults
// `experimental.useTypeScriptCli` to true (verified in
// node_modules/next/dist/server/config-shared.js), which shells out to the
// project-local `tsc` binary instead of loading the compiler API. Next's own
// docs mark that flag experimental and "not recommended for production", so the
// green build rests on an experimental default that can move.
//
// The only ways to take TypeScript 7 today are to drop type-aware linting or to
// stop running ESLint - both trade a standing quality gate for a version
// number. So the hold costs nothing: typescript 6.0.3 is the newest release the
// toolchain can actually run, and the project is already on it.
//
// This tripwire forces a scheduled re-evaluation so the hold cannot silently
// become permanent in an agent-maintained repository with no human monitor.
// It lives in the main test suite rather than a separate scheduled workflow, so
// it turns the whole pipeline red and blocks unrelated merges when it fires.
// That is the deliberate choice: a hold that suppresses a Dependabot major is
// invisible by construction, and a signal nobody is watching for needs to be
// impossible to miss rather than polite.

// Sentinel: the peer range the installed typescript-eslint declares for
// `typescript`. Read from package-lock.json, which records declared manifest
// ranges for every nested copy regardless of hoisting layout.
//
// This is deliberately NOT the `<6.1.0` quoted further up. That range belongs to
// the latest published release (8.67.0); this one belongs to the copy actually
// installed here (8.57.2, pinned transitively by eslint-config-next).
// typescript-eslint widens this range every few releases - 8.57.2 declares
// `<6.0.0`, 8.65.0 onwards declare `<6.1.0` - so the two figures differing is
// expected, not a typo. The probe must assert what is installed, because that is
// the copy that decides whether `npm run lint` can run at all.
const EXCLUDES_MAJOR_7 = '>=4.8.4 <6.0.0';

// Backstop deadline. The condition probe below can only fire once a relaxed
// typescript-eslint is actually installed here, which requires an
// eslint-config-next bump to land first. Upstream may well support TypeScript 7
// long before that reaches this lockfile, so a dated re-check is not redundant
// scaffolding - it is the only signal that does not depend on the transitive
// bump arriving.
//
// Set three weeks past the 2026-11-10 target for TypeScript 7.1 stable
// (microsoft/TypeScript#63703), which is the release that is supposed to ship
// the stable API typescript-eslint#10940 is waiting on. Expect the first check
// after this date to find 7.1 shipped but typescript-eslint still catching up;
// that is a "move the date forward", not a failure.
const REVISIT_AFTER = new Date('2026-12-01T00:00:00Z');

interface LockPackageEntry {
  version?: string;
  peerDependencies?: Record<string, string>;
}

function lockEntriesFor(packageName: string): LockPackageEntry[] {
  const lockPath = path.join(process.cwd(), 'package-lock.json');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as {
    packages: Record<string, LockPackageEntry>;
  };
  const suffix = `node_modules/${packageName}`;
  const entries = Object.entries(lock.packages)
    .filter(([key]) => key === suffix || key.endsWith(`/${suffix}`))
    .map(([, entry]) => entry);
  if (entries.length === 0) {
    throw new Error(
      `${packageName} is no longer in package-lock.json - the TypeScript major ` +
        'hold may no longer be needed; re-evaluate it and prune this file',
    );
  }
  return entries;
}

describe('tech-debt tripwire: typescript major hold', () => {
  // WHY: this is the upstream edge that actually blocks TypeScript 7. While
  // typescript-eslint declares a peer range that stops below 7.x, adopting the
  // major means giving up type-aware linting.
  // EXIT: the installed typescript-eslint stops declaring the sentinel range,
  // in particular once that range starts admitting major 7.
  // ACTION on failure: if the new range admits TypeScript 7, install the
  // candidate release and run `npm run lint && npm run typecheck && npm run
  // test && npm run build`. If all four pass, remove the `typescript` entry
  // from the `ignore` block in .github/dependabot.yml, drop the TypeScript hold
  // gotcha from CLAUDE.md, and delete this file. Otherwise keep the hold and
  // update the sentinel to the new range.
  it('typescript-eslint still declares a peer range that excludes TypeScript 7', () => {
    for (const entry of lockEntriesFor('typescript-eslint')) {
      expect(entry.peerDependencies?.typescript).toBe(EXCLUDES_MAJOR_7);
    }
  });

  // WHY: the hold suppresses a Dependabot major update. If the ignore entry is
  // ever dropped while this file still exists, TypeScript 7 PRs start landing
  // again and CI breaks on lint with no explanation attached to the change.
  // EXIT: never - this probe is permanent scaffolding for as long as the hold
  // stands.
  // ACTION on failure: either restore the `typescript` ignore entry in
  // .github/dependabot.yml, or - if the hold was deliberately lifted - delete
  // this file along with the CLAUDE.md gotcha.
  it('dependabot still ignores typescript major updates', () => {
    const dependabotConfig = readFileSync(
      path.join(process.cwd(), '.github/dependabot.yml'),
      'utf8',
    );

    expect(dependabotConfig).toContain('- dependency-name: typescript');
  });

  // WHY: forces a human decision on schedule. Without it the hold quietly
  // becomes permanent policy in a repository maintained by agents.
  // EXIT: the deadline passes.
  // ACTION on failure: re-run the exit check above against the current
  // typescript-eslint release. Lift the hold if it passes; otherwise move
  // REVISIT_AFTER forward and record what was checked.
  it('forces re-evaluation of the TypeScript 6.x hold on schedule', () => {
    // A fake clock leaked from another suite would freeze Date.now() and let
    // this tripwire pass forever; jest.config sets clearMocks, but timers are
    // restored explicitly so the deadline check reads the real system clock.
    jest.useRealTimers();

    expect(Date.now()).toBeLessThan(REVISIT_AFTER.getTime());
  });
});
