# Build & deployment

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing CDN asset hosting, production optimization, app-version meta, or the soft new-version modal.

## Asset hosting via `--deploy-url`

Production builds are served from a CDN (`static5.algorea.org` for tagged releases, `assets.algorea.org` for branch/master builds), while the HTML shell is served from the SPA host (e.g. `parcours.algorea.org`). The split is implemented in `.circleci/config.yml` via Angular's `--deploy-url` flag, which prefixes asset URLs in `index.html` and external CSS files with the CDN origin.

## Critical CSS inlining disabled in production

In each `production-*` configuration in `angular.json`, the `optimization` option is an object with `styles.inlineCritical: false` (instead of `true`, which is the Angular default). This is a workaround, not a long-term choice:

- Angular rewrites `url()` paths in external CSS files to honor `--deploy-url`, but the critical-CSS inliner (`beasties`) re-emits the selected `@font-face` rules **inside `index.html`** with their original relative paths (e.g. `./media/roboto-v30-latin-regular.woff2`).
- Those relative paths resolve against the document URL (the SPA host), not the CDN. The SPA host falls back to `index.html` for unknown routes, so the browser receives HTML where it expects a font, and Firefox's font sanitizer rejects it.
- Disabling inlining keeps all `@font-face` rules in the external stylesheet (where `url()` rewriting works correctly). FOUC is mitigated by the existing `<link rel="preload">` font tags in `src/index.html` (rewritten to the CDN by `npm run injectDeployUrlForAssets`) plus `font-display: swap`.

This should be reverted to `"optimization": true` once the underlying issue is resolved — either by Angular/`beasties` honoring `--deploy-url` when inlining critical CSS, or by serving HTML and assets from the same origin (which would also let us drop the deprecated `--deploy-url` flag).

## New version detection

The app version is stamped into `<meta name="app-version">` in `index.html` by CI before each build (`git describe --always`, overwriting any existing content; the committed source keeps `content=""` as a placeholder). Tag builds get the tag name from `git describe`. Sentry events use `algorea@` plus that version with a leading `v` stripped (`algorea@2.94.2`), which is the `package@version` form Sentry requires to treat releases as semver; the HTML meta is left unchanged so version-check still compares `git describe` strings. Sourcemap upload in CI uses the same Sentry release name. `AppVersionCheckService` checks for a newer build after ≥ 20 minutes of inactivity: either the tab was hidden that long and becomes visible again, or JS was frozen (system sleep / lid-close while still visible). While visible, wake is the earliest of: first `pointerdown` / `keydown` on the parent document past that gap (not events inside task/description iframes), `resume` / `focus` / `pageshow`, or a ~30s heartbeat. On either path it re-fetches the same-origin HTML shell (this locale's `document.baseURI`), compares meta values, and — on mismatch only — opens a blocking reload modal. Offline (HTTP status 0) gets one short delayed retry; other fetch/parse/missing-version failures are ignored silently. There is no auto-reload. In non-production builds, `window.algoreaPreviewNewVersionModal()` opens the modal for visual preview.
