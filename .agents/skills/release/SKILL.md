---
name: release
description: Cut a new AlgoreaFrontend release - changelog entry from merged PRs, version bump, commit, tag, push and GitHub release. Use when the user wants to release, bump the version, tag, or write a changelog entry. Supports auto mode (no human interaction).
---

# Release

Steps run in order. Two modes:

- **Interactive** (default): pause where a step says so.
- **Auto mode**: the caller asked for it (`/release auto`, "release without asking", ...). Never pause: accept the proposed version and entries, run the release command, create the GitHub release, and report everything in the final summary.

A **stop** below applies in both modes: report the reason and end the run, with nothing more committed, pushed or published.

## 1. Verify state

```bash
git branch --show-current
git status --porcelain
git fetch origin
git rev-list --left-right --count master...origin/master
```

Stop unless: on `master`, empty porcelain output, and the count is `0	0` (local `master` neither ahead of nor behind `origin/master`).

## 2. Read current version

The latest section heading at the top of `CHANGELOG.md`:

```
## [vX.Y.Z](https://github.com/France-ioi/AlgoreaFrontend/compare/vA.B.C...vX.Y.Z) - YYYY-MM-DD
```

Stop if this version differs from `git describe --tags --abbrev=0` (the changelog is out of sync with the tags). The version lives only in the changelog and the tags: `package.json` has none.

## 3. Collect changes

```bash
git log --oneline --merges $(git describe --tags --abbrev=0)..HEAD
git log --oneline $(git describe --tags --abbrev=0)..HEAD
```

Stop if there is no commit since the last tag. For each merged PR, `gh pr view <number> --json title,body` gives the context the merge commit lacks.

Write one entry per meaningful change:

- the **user-facing impact** (what a learner, teacher or content author sees or can do), or the deployment impact (new config key, newer backend required), not the implementation;
- concise plain English, starting with a lowercase verb or noun phrase (`- add ...`, `- fix ...`, `- item parameters: ...`);
- no PR or commit links (older entries have them; new ones do not).

Skip internal-only changes (refactors, CI, tests, dependency bumps) unless they visibly affect reliability or performance. If only internal changes remain, the release is a patch with the single entry `- internal maintenance`.

## 4. Decide the version bump

| Changes | Bump |
|---|---|
| Only fixes, small visual corrections, dependency bumps, internal improvements | patch (x.y.**Z+1**) |
| Any new user-visible feature, page, option or behaviour change, or a new deployment requirement (new config key, newer backend version) | minor (x.**Y+1**.0) |
| A sweeping change that may deserve a major (redesign, dropped feature, incompatible config) | minor too, but **flag it** so the user can choose a major bump |

When in doubt between patch and minor, pick minor. In auto mode, a flagged change stays minor and the flag goes in the final summary.

## 5. Proposal

Show the proposed version (`vX.Y.Z`, was `vA.B.C`) and the CHANGELOG section of step 6, dated today.

**Interactive: stop here** until the user approves, edits the entries, or changes the version. Auto mode: continue.

## 6. Update CHANGELOG.md

Insert the new section right after the `# Changelog` header and its subtitle line, before the previous latest section. Exact layout (blank line after the heading and after the bullets):

```
## [vX.Y.Z](https://github.com/France-ioi/AlgoreaFrontend/compare/vA.B.C...vX.Y.Z) - YYYY-MM-DD

- entry one
- entry two

```

Leave the rest of the file untouched.

## 7. Commit, tag and push

The release command, with the real version:

```bash
VERSION=X.Y.Z; git add CHANGELOG.md && git commit -m "Release $VERSION" && git tag -a -m "Release v$VERSION" v$VERSION && git push origin v$VERSION && git push origin master
```

- **Interactive**: show it, explain it commits the changelog, creates the annotated tag and pushes both, and tell the user they can either run it or reply **"do it"**. On "do it", run exactly this command, nothing else. If the user runs it themselves, wait for them to say it is done.
- **Auto mode**: run it.

If any part fails, stop and report the output; leave recovery (retries, tag deletion, force pushes) to the user.

## 8. GitHub release

The tag triggers CI (build, upload of the versioned assets and Sentry sourcemaps, ops notification), but CI does not create the GitHub release; this step does, without waiting for CI. Check the tag reached `origin` (`git ls-remote --tags origin vX.Y.Z`), then build the notes from the new section's bullets and create the release:

```bash
VERSION=X.Y.Z; awk '/^## /{n++; next} n==1 && NF' CHANGELOG.md > /tmp/release-notes-v$VERSION.md && gh release create v$VERSION --verify-tag --title "Release $VERSION" --notes-file /tmp/release-notes-v$VERSION.md
```

- **Interactive**: show the command and the notes, and wait for **"do it"** (or the user doing it themselves).
- **Auto mode**: run it.

No assets are attached; `gh` marks it as the latest release. End with a summary: version, entries, release URL, anything flagged.
