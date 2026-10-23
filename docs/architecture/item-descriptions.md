# Item descriptions (sandboxed iframe rendering)

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing description HTML rendering, the description iframe protocol, preview/help, or author link patterns.

Stored item descriptions (`item.string.description`) and the editor Parameters **Preview** tab render HTML through `alg-description-iframe` instead of `[innerHTML]` on the host page.

- **Where**: `ItemContentComponent` (chapter/skill descriptions) and `PreviewHtmlComponent` (preview panel).
- **Mechanism**: A sandboxed `<iframe>` with `srcdoc` composed of a small HTML shell, injected base CSS (`description-iframe.styles.ts`), and the author HTML. Plain-text descriptions (no HTML element nodes, same rule as `algHasHTML`) are escaped and wrapped in `<p>` so they pick up the same reading-width typography as paragraphs in authored HTML. On the item page the Content tab keeps the regular `.content-container` top padding so the spacing between the tab bar and the chapter children is preserved whether or not a description is present (the iframe `body` itself has no extra top padding, otherwise it would stack on top of the outer one). `sandbox="allow-scripts"` is used **without** `allow-same-origin`, so the document keeps an opaque origin: scripts can run, but the iframe cannot access parent cookies, storage, or the parent DOM.
- **Sanitization**: `DomSanitizer.bypassSecurityTrustHtml` is applied only to the iframe `srcdoc`, never to bindings in the Angular app shell.
- **Base CSS**: A bundled subset of `--alg-*` tokens (aligned with `src/variables.scss`) and typography rules approximate former `.html-container` styling so plain markup stays on-brand; authors can override via their own CSS inside the description. The iframe uses the parent content width; default prose uses `--description-reading-max-width` (57.5rem / 920px) on `p`, headings, lists, `blockquote`, and `pre`. Tables stay full width of the iframe. A `.full-width` opt-in utility class (with `max-width: 100% !important`) is bundled so authors can lift the cap per element without writing their own CSS; the whole cap can also be lifted by overriding `--description-reading-max-width` on `:root`. Both are documented in the editor's "help" panel (`item-edit-content-help`). By default the host keeps the same horizontal inset as `#main-container` (`--alg-space-size-2`); authors can opt into a full-bleed panel width with `data-alg-layout="edge-to-edge"` (or boolean `data-alg-edge-to-edge`) on any element in the description HTML — the host then applies negative margins sized by inherited custom properties: `--alg-description-page-inset` (horizontal, from `#main-container` or the preview wrapper), `--alg-description-page-inset-top` (e.g. `.content-container` top padding), and `--alg-description-page-inset-bottom` (spacing below the description host). Layout spacing under the block is handled on `alg-description-iframe` (`:host`), not via legacy `.description` classes on the parent page.
- **Theming**: Customer branding CSS is injected at deploy time as an inline `<style>` on the parent page (`customStyleFile` in the customer `build-config.yaml`, handled by AlgoreaOps). Common overrides: `--alg-primary-color`, `--alg-tree-selected-color` (left nav tree/search selection), `--alg-left-tab-selected-bg-color` (active vertical tab pill in `alg-left-tab-bar`; defaults to `--alg-white-color`), `--alg-light-bg-color` (scoped under `.left-menu` for panel background only). The iframe is opaque-origin so parent stylesheets cannot reach inside; `DescriptionIframeComponent` snapshots the parent `:root` CSS variables at construct time via `buildParentCssVarOverrides()` and appends them to the iframe base CSS. Custom web fonts referenced by deploy-time overrides are not loaded inside the iframe and fall back to the next available family; if the design needs the exact face inside descriptions, declare `@font-face` (or a `<link>` to the CDN) in the customer CSS or inside `descriptionBaseCss`.
- **Hygiene**: `referrerpolicy="no-referrer"` and `loading="lazy"` on the iframe. Height is no longer fixed (see v2 messaging-protocol below); the iframe never scrolls — the parent grows it.

## v2 messaging protocol (iframe → parent)

Lightweight `postMessage` channel between the sandboxed description iframe and `alg-description-iframe`. Three fire-and-forget messages, validated parent-side with zod schemas in [description-iframe.messages.ts](../../src/app/ui-components/description-iframe/description-iframe.messages.ts):

- `{ type: 'alg.updateDisplay', data: { height: number } }` — sent on every content size change. Parent writes the inline `style.height` accordingly and, on the very first message, drops the `--alg-description-iframe-min-height` floor (which was a *loading-only* placeholder, ~200px by default) so short descriptions are also free to collapse. Combined with `html, body { overflow: hidden }` in the base CSS, the iframe is never scrollable from the inside.
- `{ type: 'alg.navigate', data: { itemId, child? } | { url } }` — request a navigation. `union` of the two variants; consumers narrow with `'url' in req` / `'itemId' in req`. The `url` variant only accepts absolute `http(s)` URLs (validated parent-side via `new URL(...)` + protocol allowlist) — relative paths, `javascript:`, `data:`, `mailto:`, `tel:`, etc. are silently dropped. This is defense in depth: the runtime helper already filters `javascript:` hrefs, but an author with script access could `parent.postMessage(...)` directly. Internal navigation must go through `data-item-id` instead of relative URLs.
- `{ type: 'alg.scrollIntoView', data: { offset: number } }` — sent when an in-page hash anchor is clicked inside the iframe. The offset is the target element's Y position from the top of the iframe document (CSS px). Parent walks up from the iframe to the nearest scrollable ancestor (`overflow-y: auto|scroll`) and scrolls it so the target lands at the top, falling back to `window.scrollTo` if no scrollable ancestor is found. **Why we can't just let the browser handle the hash**: in `srcdoc` iframes, fragment navigation actually navigates to `about:srcdoc#name` (a blank document), wiping the description body — and even if it didn't, `overflow: hidden` would prevent any in-frame scroll from being visible. The helper resolves targets by `id` first, then by the legacy `name` attribute (`<a name="…">`).

### Source filter (no `event.origin`)

The iframe runs `sandbox="allow-scripts"` (no `allow-same-origin`), so the document has an opaque origin and `event.origin` is the literal string `"null"`. The parent listener compares `event.source === iframeRef.nativeElement.contentWindow` instead — the only reliable filter under opaque origin. Any inbound message failing this check or zod validation is silently dropped.

### Auto-injected runtime helper (no `import` for authors)

A vanilla-JS helper ([description-iframe.runtime.ts](../../src/app/ui-components/description-iframe/description-iframe.runtime.ts)) is inlined as a `<script>` in every srcdoc. It:

- Uses `ResizeObserver` (with `requestAnimationFrame` debounce) to emit `alg.updateDisplay` whenever the document height changes — handles late image loads automatically.
- Intercepts clicks on **every** `<a>` anchor and turns them into `alg.navigate` messages — without this, browsers (notably Firefox) navigate the iframe document itself because the sandbox blocks `_blank` / top-frame navigation, replacing the description and trapping the user inside it. Classification:
  - `<a data-item-id="123">…</a>` → `{ itemId: '123' }`
  - `<a data-item-id="123" data-child>…</a>` → `{ itemId: '123', child: true }` (resolves to a child of the currently-displayed item)
  - `<a data-url="https://…">…</a>` → `{ url }` from the data attribute
  - `<a href="https://…">…</a>` (or any non-hash, non-`javascript:` href) → `{ url: href }` — same external-URL flow as `data-url`. Note that the schema only accepts http(s) URLs, so `<a href="/internal">`, `<a href="mailto:…">`, etc. will be silently dropped parent-side — author-friendly errors aren't surfaced today; use `data-item-id` for internal navigation.
  - `<a href="#section">…</a>` → `alg.scrollIntoView` (parent scrolls — see message description above; in-page browser scroll cannot work inside the sandboxed `srcdoc` iframe)
  - `<a href="javascript:…">…</a>` → swallowed (never escalated to the parent surface)
- Authors who want a fully custom flow can still call `parent.postMessage(...)` themselves without importing anything.

Modifier-key behavior on intercepted anchors is intentionally swallowed: item navigations always replace the current page and `{ url }` always opens in a new tab. Author-controlled HTML is treated as potentially hostile — we never let it replace the parent page through this channel.

### External-URL handling: heads-up toast + delayed auto-open

When `ItemContentComponent.onDescriptionNavigate` receives a `{ url }` payload:

1. An info toast is shown via `MessageService` ("Navigating to an external link" + the URL itself, default 5s lifetime).
2. The URL auto-opens in a new tab after **900 ms**, deliberately inside the browser's ~1s "transient user activation" window so popup blockers stand down. If a future browser tightens that window, the click handler on the toast remains as a user-gesture fallback.
3. Both paths converge through a `merge(clicked$, timer(900)).pipe(take(1))` so the tab is opened at most once.

### Preview surface

`PreviewHtmlComponent` deliberately does **not** route — the preview tab is for editing a (possibly unsaved) item. It instead surfaces every `navigationRequested` event as an info toast describing the intended target, so editors can validate that their `data-item-id` / `data-child` / `data-url` anchors are wired correctly.

The description editor (`ItemEditContentComponent`) exposes a third **Help** tab next to *Write* / *Preview*. It hosts `alg-item-edit-content-help`, a static, fully-i18n component that documents what authors can put in a description (HTML/CSS/JS in the sandbox, allowed link patterns, dropped schemes) and the `postMessage` protocol for scripted navigation/scrolling/height. Keep its examples in sync when extending the v2 messaging protocol.

### Why vanilla over penpal

Both messages are notifications, not RPC; the helper is ~30 lines and adds no new runtime dep (zod is already bundled). A future surface that genuinely needs request/response semantics could layer one on top without breaking this protocol. Tasks (which need RPC: `grade`, `getAnswer`, `validate`) keep using `jschannel` via [task-proxy.ts](../../src/app/items/api/task-proxy.ts).
