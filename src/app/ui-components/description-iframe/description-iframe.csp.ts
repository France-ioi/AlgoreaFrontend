import { DescriptionContentSecurityPolicy } from 'src/app/config/description-content-security-policy';

function sourcesOrNone(origins: readonly string[]): string {
  return origins.length === 0 ? "'none'" : origins.join(' ');
}

/** CSP policy string for a description srcdoc meta tag (fixed directives + configured origins). */
export function buildDescriptionContentSecurityPolicy(
  allowlist: DescriptionContentSecurityPolicy,
): string {
  const styleSrc = [ "'unsafe-inline'", ...allowlist.styleSrc ].join(' ');
  const imgSrc = [ 'data:', ...allowlist.imgSrc ].join(' ');
  return [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    `style-src ${styleSrc}`,
    `font-src ${sourcesOrNone(allowlist.fontSrc)}`,
    `img-src ${imgSrc}`,
    `media-src ${sourcesOrNone(allowlist.mediaSrc)}`,
    `connect-src ${sourcesOrNone(allowlist.connectSrc)}`,
    `frame-src ${sourcesOrNone(allowlist.frameSrc)}`,
    "form-action 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "navigate-to 'none'",
  ].join('; ');
}
