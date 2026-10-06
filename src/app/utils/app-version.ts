/** Sentry org-global release package; must match `--project algorea` in CI sourcemap upload. */
const SENTRY_RELEASE_PACKAGE = 'algorea';

export function readAppVersionFromDocument(doc: Document): string | null {
  const content = doc.querySelector('meta[name="app-version"]')?.getAttribute('content');
  if (content === null || content === undefined || content === '') return null;
  return content;
}

export function readAppVersionFromHtml(html: string): string | null {
  return readAppVersionFromDocument(new DOMParser().parseFromString(html, 'text/html'));
}

/**
 * Sentry only treats a release as semver when the name is `package@version` (not a bare
 * `v2.94.2`). A leading `v` is also rejected (getsentry/sentry#87305, closed not planned).
 */
export function toSentryRelease(appVersion: string | null): string | undefined {
  if (appVersion === null || appVersion === '') return undefined;
  const version = appVersion.replace(/^v(?=\d)/, '');
  return `${SENTRY_RELEASE_PACKAGE}@${version}`;
}
