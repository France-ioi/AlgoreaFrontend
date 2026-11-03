import { z } from 'zod';

/**
 * Per-deployment allowlist for the description iframe Content-Security-Policy.
 * Origins only: scheme + host + optional port. No path, query, fragment, or wildcards.
 */

const httpHttpsProtocols: readonly string[] = [ 'http:', 'https:' ];
const connectProtocols: readonly string[] = [ 'http:', 'https:', 'ws:', 'wss:' ];

/**
 * True when `value` is an origin (scheme://host[:port], optional trailing slash).
 * Host matching is case-insensitive; an explicit default port (e.g. `:443` on https) is allowed.
 */
function isOrigin(value: string, protocols: readonly string[]): boolean {
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol)) return false;
    if (url.username !== '' || url.password !== '') return false;
    if (url.search !== '' || url.hash !== '') return false;
    // Bare origins parse with pathname "/"; anything else is a path and must be rejected.
    if (url.pathname !== '/') return false;
    if (url.hostname === '' || url.hostname.includes('*')) return false;
    // Reject junk after the authority other than an optional trailing slash (no path segments).
    return /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+\/?$/i.test(value);
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
