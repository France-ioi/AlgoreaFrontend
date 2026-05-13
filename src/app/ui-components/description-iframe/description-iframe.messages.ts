import { z } from 'zod';

/**
 * Wire protocol for messages sent from the sandboxed description iframe to its parent.
 *
 * The iframe runs with `sandbox="allow-scripts"` (no `allow-same-origin`), so the document has an
 * opaque origin and `event.origin` is the literal string `"null"`. Source-window comparison
 * (`event.source === iframeEl.contentWindow`) is the only reliable filter, applied parent-side.
 *
 * Both messages are fire-and-forget notifications iframe → parent. There is no request/response
 * RPC layer; if a future surface needs RPC we can layer one on top without breaking these schemas.
 *
 * Messages are validated with `iframeMessageSchema` before any side-effect — invalid payloads are
 * silently dropped.
 */

export const updateDisplayMessageSchema = z.object({
  type: z.literal('alg.updateDisplay'),
  data: z.object({
    height: z.number().nonnegative(),
  }),
});

/**
 * Hash anchor inside the description (e.g. `<a href="#bottom">`) — `srcdoc` iframes can't
 * fragment-navigate themselves without going blank, and `overflow: hidden` would prevent any
 * in-frame scroll anyway. The helper reports the target's Y offset (from the top of the iframe
 * document, in CSS px) and the parent scrolls the iframe's nearest scrollable ancestor.
 */
export const scrollIntoViewMessageSchema = z.object({
  type: z.literal('alg.scrollIntoView'),
  data: z.object({
    offset: z.number(),
  }),
});

/**
 * Defense-in-depth URL validation for the `{ url }` navigate variant.
 *
 * Required because authors aren't bound to the runtime helper — anyone with script access inside
 * the sandbox can call `parent.postMessage({ type: 'alg.navigate', data: { url: 'javascript:…' } })`.
 * Without this filter, the URL would reach `MessageService` (toast UX leak) and `openNewTab`
 * (currently neutralized only by an incidental side-effect of `pathToUrl`'s scheme regex —
 * fragile across refactors).
 *
 * Uses the `URL` constructor rather than a regex so:
 *   - Relative URLs throw (constructor needs a base) → rejected. Authors who want internal
 *     navigation use `data-item-id`; srcdoc iframes can't resolve relative URLs sensibly anyway.
 *   - Dangerous schemes parse but are filtered out: `javascript:`, `data:`, `vbscript:`,
 *     `file:`, `blob:`, `mailto:`, `tel:`, `ftp:`, `about:`…
 *   - Malformed strings (whitespace, control chars, etc.) throw → rejected.
 * Only `http:` and `https:` pass.
 */
const externalUrlSchema = z.string().refine(
  (raw): boolean => {
    try {
      const u = new URL(raw);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'must be an absolute http(s) URL' },
);

/**
 * Navigation request payload — variant by presence of `itemId` vs `url`, validated as a `z.union`
 * (no shared discriminator field). Consumers narrow with `'url' in req` / `'itemId' in req`.
 *
 * `child` is normalized to `false` at parse time (`.default(false)`), so the parsed output type
 * exposes `child: boolean` rather than `boolean | undefined` — consumers can branch on
 * `if (req.child)` without a separate undefined check.
 */
export const navigateRequestSchema = z.union([
  z.object({
    itemId: z.string().min(1),
    child: z.boolean().default(false),
  }),
  z.object({
    url: externalUrlSchema,
  }),
]);

export const navigateMessageSchema = z.object({
  type: z.literal('alg.navigate'),
  data: navigateRequestSchema,
});

export const iframeMessageSchema = z.discriminatedUnion('type', [
  updateDisplayMessageSchema,
  navigateMessageSchema,
  scrollIntoViewMessageSchema,
]);

export type UpdateDisplayMessage = z.infer<typeof updateDisplayMessageSchema>;
export type NavigateMessage = z.infer<typeof navigateMessageSchema>;
export type ScrollIntoViewMessage = z.infer<typeof scrollIntoViewMessageSchema>;
export type IframeMessage = z.infer<typeof iframeMessageSchema>;

/** Payload exposed via the component output — the inner `data` of a parsed navigate message. */
export type DescriptionIframeNavigationRequest = z.infer<typeof navigateRequestSchema>;
