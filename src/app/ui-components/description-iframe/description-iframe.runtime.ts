/** Marker string asserted by unit tests to ensure the runtime helper is injected into srcdoc. */
export const DESCRIPTION_IFRAME_RUNTIME_MARKER = 'alg-description-iframe-runtime';

/**
 * Vanilla JS helper auto-injected as a `<script>` inside the sandboxed description iframe srcdoc.
 *
 * What it does (no external deps, ~1.2 KB):
 *  1. Reports the document height to the parent (`alg.updateDisplay`) via `ResizeObserver`,
 *     debounced through `requestAnimationFrame`, so the parent can grow the iframe and never
 *     show a scrollbar inside.
 *  2. Intercepts clicks on every `<a>` anchor and turns them into structured `alg.navigate` /
 *     `alg.scrollIntoView` messages, so the parent decides the destination (and external URLs
 *     always end up in a new tab — see component-side handler). Anchor classification:
 *       - `data-item-id`            → `{ itemId, child? }` (resolved item navigation)
 *       - `data-url`                → `{ url }` from the data attribute
 *       - plain `href`              → `{ url: href }`
 *         Without this, browsers (e.g. Firefox) navigate the iframe document itself because
 *         the sandbox blocks `_blank` / top-frame navigation, which both replaces the
 *         description and traps the user inside it. Routing through the parent is the safe
 *         default.
 *       - `href="#name"`            → `alg.scrollIntoView` with the target's Y offset inside
 *         the iframe; the parent scrolls the nearest scrollable ancestor. We can't fall back
 *         to the browser default here: in `srcdoc` iframes, fragment navigation actually
 *         navigates to `about:srcdoc#name` (a blank document), wiping the description body.
 *         And since the iframe runs `overflow: hidden` (parent owns the height), an in-frame
 *         scroll wouldn't move the visible viewport anyway. Targets are looked up by `id`
 *         first, then by legacy `name` attribute (`<a name="…">`).
 *       - `href="javascript:…"`     → swallowed (never escalated to the parent surface)
 *
 *     Modifier keys (ctrl/meta) and middle-click are intentionally not propagated: item
 *     navigations always replace the current page, external URLs always open in a new tab on the
 *     parent side.
 *
 * Authors don't have to import anything. They can also bypass this helper entirely and call
 * `parent.postMessage(...)` themselves. ES5-only syntax on purpose to avoid any transpile step
 * for the inlined string.
 *
 * Security: the script is a string literal owned by us; it runs inside the opaque-origin sandbox
 * so it cannot read parent state. Embedding it in the bypassed `srcdoc` remains safe — the
 * security boundary is the sandbox attribute, not the bypass.
 */
export const descriptionIframeRuntimeJs = `
/* ${DESCRIPTION_IFRAME_RUNTIME_MARKER} */
(function () {
  var post = function (m) { try { parent.postMessage(m, '*'); } catch (e) {} };
  var last = -1, scheduled = false;
  var measure = function () {
    scheduled = false;
    var h = document.documentElement.getBoundingClientRect().height;
    if (h !== last) { last = h; post({ type: 'alg.updateDisplay', data: { height: h } }); }
  };
  var queue = function () { if (!scheduled) { scheduled = true; requestAnimationFrame(measure); } };

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(queue).observe(document.documentElement);
  } else {
    addEventListener('load', queue);
    addEventListener('resize', queue);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = t && t.closest && t.closest('a');
    if (!a) return;
    var ds = a.dataset || {};
    if (ds.itemId) {
      e.preventDefault();
      post({ type: 'alg.navigate', data: { itemId: ds.itemId, child: ds.child !== undefined } });
      return;
    }
    if (ds.url) {
      e.preventDefault();
      post({ type: 'alg.navigate', data: { url: ds.url } });
      return;
    }
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#') {
      // srcdoc-iframe quirk: a fragment nav reloads about:srcdoc#name as a blank doc, so always
      // intercept hash links and ask the parent to scroll. Falling through would empty the iframe.
      e.preventDefault();
      var id = href.slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) {
        var named = document.getElementsByName(id);
        target = named && named[0] ? named[0] : null;
      }
      if (!target) return;
      // window.scrollY is 0 inside an overflow:hidden iframe, so getBoundingClientRect().top is
      // the absolute Y offset from the top of the iframe document.
      post({ type: 'alg.scrollIntoView', data: { offset: target.getBoundingClientRect().top } });
      return;
    }
    // Hostile/unsupported scheme: drop on the floor; never propagate javascript: URLs to the parent.
    if (/^javascript:/i.test(href)) { e.preventDefault(); return; }
    e.preventDefault();
    post({ type: 'alg.navigate', data: { url: href } });
  });

  queue();
})();
`;
