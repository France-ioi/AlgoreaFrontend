import { z } from 'zod';

/**
 * Per-deployment allowlist for the description iframe Content-Security-Policy.
 * Origins only: scheme + host + optional port. No path, query, fragment, or wildcards.
 */

const httpHttpsProtocols: readonly string[] = [ 'http:', 'https:' ];
const connectProtocols: readonly string[] = [ 'http:', 'https:', 'ws:', 'wss:' ];

function isOrigin(value: string, protocols: readonly string[]): boolean {
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol)) return false;
    if (url.username !== '' || url.password !== '') return false;
    // Origins have no path/query/hash; URL parser normalizes a bare origin to pathname "/".
    if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return false;
    if (url.hostname === '' || url.hostname.includes('*')) return false;
    // Rebuild without `url.origin` — browsers remap `ws:`/`wss:` origins to `http:`/`https:`.
    const expected = `${url.protocol}//${url.host}`;
    return value === expected;
  } catch {
    return false;
  }
}

const httpOriginSchema = z.string().refine(
  (value): boolean => isOrigin(value, httpHttpsProtocols),
  { message: 'Expected an http(s) origin (scheme://host[:port], no path)' },
);

const connectOriginSchema = z.string().refine(
  (value): boolean => isOrigin(value, connectProtocols),
  { message: 'Expected an http(s)/ws(s) origin (scheme://host[:port], no path)' },
);

export const descriptionContentSecurityPolicySchema = z.object({
  styleSrc: z.array(httpOriginSchema).optional().default([]),
  fontSrc: z.array(httpOriginSchema).optional().default([]),
  imgSrc: z.array(httpOriginSchema).optional().default([]),
  mediaSrc: z.array(httpOriginSchema).optional().default([]),
  connectSrc: z.array(connectOriginSchema).optional().default([]),
  frameSrc: z.array(httpOriginSchema).optional().default([]),
}).strict();

export type DescriptionContentSecurityPolicy = z.infer<typeof descriptionContentSecurityPolicySchema>;

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
