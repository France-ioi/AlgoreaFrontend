/**
 * Return the CDN prefix Angular applies via --deploy-url on production builds.
 *
 * Reads the first absolute main-bundle <script> src (e.g. //cdn.example.org/en/main-xxx.js)
 * and returns its directory (//cdn.example.org/en/). Skips same-origin scripts such as
 * assets/config.js, which is served from the SPA host.
 *
 * Returns an empty string locally, where bundles are same-origin relative paths.
 */
export function getDeployUrlPrefix(): string {
  const cdnScript = Array.from(document.querySelectorAll('script[src]')).find(script => {
    const src = script.getAttribute('src') ?? '';
    return src.startsWith('//') || src.startsWith('http://') || src.startsWith('https://');
  });
  const src = cdnScript?.getAttribute('src');
  if (!src) return '';

  return src.substring(0, src.lastIndexOf('/') + 1);
}

/**
 * Build a URL for a file emitted under `assets/` in the Angular build output.
 *
 * Production main bundles live under `<deploy-url>assets/`, so the prefix already ends
 * with `assets/` and only the subpath (e.g. `scripts/foo.js`) must be appended.
 * Locally the prefix is empty and the full `assets/…` path is needed.
 */
export function deployUrlAssetPath(relativePath: string): string {
  const prefix = getDeployUrlPrefix();
  if (!prefix) return `assets/${relativePath}`;
  if (prefix.endsWith('assets/')) return `${prefix}${relativePath}`;
  return `${prefix}assets/${relativePath}`;
}
