/**
 * Build an absolute URL for a file emitted under `assets/` in the Angular build output.
 *
 * Resolved against `import.meta.url` (the URL of the running bundle) rather than guessed from
 * the page's <script> tags: deployments inject third-party head tags (e.g. Matomo inserting
 * its tracker as the first script), so scanning the DOM may pick a foreign host. Bundles and
 * `assets/` share the same `--deploy-url` folder, so this works on the CDN and locally.
 */
export function bundleAssetUrl(relativePath: string): string {
  return new URL(`assets/${relativePath}`, import.meta.url).href;
}
