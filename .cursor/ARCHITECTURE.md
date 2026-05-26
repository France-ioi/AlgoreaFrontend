# Algorea Frontend Architecture

## Overview

Algorea Frontend is an Angular 21 educational platform that provides features for managing learning activities, skills, groups, and user progress. It uses ngrx for state management and communicates with a backend API.

## Project Structure

```
src/app/
├── config/              # App configuration (injection tokens, services)
├── containers/          # Smart components (layout, navigation, modals)
├── data-access/         # HTTP services for API communication
├── directives/          # Reusable Angular directives
├── guards/              # Route guards
├── interceptors/        # HTTP interceptors
├── models/              # Domain models and routing utilities
├── pipes/               # Reusable Angular pipes
├── services/            # Application services (auth, layout, navigation)
├── store/               # Root ngrx store (config, navigation, router, time-offset)
├── ui-components/       # Presentational/dumb components
├── utils/               # Utility functions and helpers
│
├── items/               # Items feature module (activities, skills, tasks)
├── groups/              # Groups feature module (users, teams, classes)
├── forum/               # Forum feature module (discussions, threads)
├── community/           # Community feature module (gated by community flag)
└── lti/                 # LTI integration module
```

## Left Navigation Component Hierarchy

```
alg-left-panel          → outer shell: header + tabbed-content + search input
└── alg-left-tabbed-content  → tab bar + search results + tree delegation
    ├── alg-left-tab-bar
    └── alg-left-nav
```

- **`alg-left-panel`**: Outer shell — header, tabbed content area, search input bar
- **`alg-left-tabbed-content`**: Orchestrator — owns active tab logic, search, tab-to-tree index mapping, scroll-to-element
- **`alg-left-tab-bar`**: Presentational — renders tab buttons, emits tab selection events
- **`alg-left-nav`**: Tree rendering — receives a `treeIndex` input, renders the corresponding nav tree
- Tab indices and tree service indices are decoupled via `tabToTreeIndex()` mapping

## Core Concepts

### Items
Items represent learning content and can be:
- **Activities**: Tasks, chapters, courses
- **Skills**: Competency tracking

Items are accessed via routes like `/a/:idOrAlias` (activities) or `/s/:idOrAlias` (skills).

Display-related per-item settings live in `Item.displaySettings` (camelCase object decoded from `display_settings`, with Zod defaults in `displaySettingsSchema`). Write via `display_settings` on `ItemChanges` using `buildDisplaySettingsBody()`.

### Item parameters form (editor "Parameters" tab)

The editor's Parameters tab is structured as a wrapper + a self-contained typed CVA form, with the per-section parameters domain extracted to a dedicated model.

```
alg-item-edit-wrapper                  (orchestrator: itemForm + imageUrlForm + save/cancel)
└── alg-item-all-strings-form          (CVA: per-language strings, see strings folder)
└── alg-item-parameters-form           (CVA + Validator: aggregates parameter sections)
    ├── alg-item-parameters-global         (presentational: url / uses_api / text_id)
    ├── alg-item-parameters-score          (presentational: validation_type / no_score)
    ├── alg-item-parameters-display        (presentational: prompt_to_join_group_by_code / children_layout, hosts the wrapper-owned image-url input)
    ├── alg-item-parameters-participation  (CVA + Validator: explicit entry / duration / entering-time min-max)
    └── alg-item-parameters-team           (CVA + Validator: team participant type / frozen teams / max team size)
```

- **Domain model** (`src/app/items/models/item-parameters.ts`): `ItemParametersValue` is the flat camelCase value the wrapper consumes. `sectionsForItemType()` decides which sections an item type renders (and `buildItemParametersChanges()` diffs accordingly). The "no constraint" sentinels for `entering_time_min/max` (`1000-01-01` / `9999-12-31`) and the `display_settings` body shaping live here so the form and the diff agree.
- **Strings changes** (`src/app/items/models/item-strings-changes.ts`): per-language string diff. `image_url` lives on the default-language item string (not on the item), so the wrapper owns it via a separate `imageUrlForm` and threads it into `buildItemAllStringsChanges()` only for the default-language record.
- **CVA boundary**: `alg-item-parameters-form` flattens its inner `{ global, score, display, participation, team }` group into `ItemParametersValue` on `valueChanges` and unflattens on `writeValue`, so the wrapper sees a single flat control. Each leaf CVA (`participation`, `team`) returns `null` from `validate()` when its inner form is disabled, since Angular reports `valid === false` for `DISABLED` controls and would otherwise wedge the wrapper's `itemForm.invalid` check on every save.
- **Change detection**: the three stateless section components (`global`, `score`, `display`) declare `OnPush`. The parent form (`alg-item-parameters-form`) and the two CVA sections (`participation`, `team`) keep Default CD; only the participation section needs it — `alg-input-date`'s ngx-mask binding uses a deferred `setTimeout` in `writeValue`, which lands outside any input/event that would re-mark an `OnPush` ancestor, so the initial value would never paint into the input. Default CD on the others avoids scattering `markForCheck()` calls across the tree.
- **Save ordering** (`ItemEditWrapperComponent.save()`): requests are split into three sequential phases driven by the item ↔ item-strings dependency on the backend (`default_language_tag` must point at an existing `items_strings` row):
  1. **Creates** — `PUT /items/{id}/strings/{tag}` for languages added in this edit session.
  2. **Item update** — `PUT /items/{id}` (which may carry the new `default_language_tag`).
  3. **Updates + deletes (parallel)** — `PUT /items/{id}/strings/{tag}` for existing translations that changed, and `DELETE /items/{id}/strings/{tag}` for languages removed from the form. Running deletes after the item update lets the user demote-then-delete the previous default language in a single save.

  `ItemAllStringsFormComponent.validate()` deliberately reads `this.form.controls.allStrings.invalid` (the inner `FormArray`) rather than `this.form.invalid` (the wrapping `FormGroup`): the wrapper's CVA validator runs from inside the array's `valueChanges`, before the parent group's `updateValueAndValidity()` has propagated, so the group status reports the pre-change value. The validator additionally polls the live `ItemStringsControl` children to cover the brief window between adding a translation and `scheduleRevalidation()` firing its registered validator.

### Groups
Groups represent organizational units:
- **Users**: Individual learners
- **Teams**: Collaborative groups
- **Classes**: Managed learning groups

Groups are accessed via `/groups/by-id/:id` or `/groups/users/:id`.

## State Management

### ngrx Store Architecture

```
Root Store
├── config          # Application configuration
├── navigation      # Current/selected content state
├── notification    # User notifications from SLS API
├── router          # Router state (via @ngrx/router-store)
├── time-offset     # Server time synchronization
└── websocket       # WebSocket connection state

Feature Stores (lazy-loaded)
├── items/store     # Item content, fetching, routing
├── groups/store    # Group content, fetching, routing
└── forum/store     # Forum threads, messages, follow status
```

### Store Pattern

Each store follows this structure:
```
feature/store/
├── feature.actions.ts    # Action definitions
├── feature.effects.ts    # Side effects (API calls)
├── feature.reducer.ts    # State mutations
├── feature.selectors.ts  # State queries
├── feature.state.ts      # State interface
└── feature.store.ts      # createFeature() export
```

Stores are exported via `fromFeature` namespace (e.g., `fromItemContent`, `fromGroupContent`).

### FetchState Pattern

Async state uses `FetchState<T>` from `src/app/utils/state.ts`:

```typescript
type FetchState<T> = Ready<T> | Fetching<T> | FetchError;
```

- `fetchingState()` - loading state, `isFetching: true`
- `readyState(data)` - success state, `isReady: true`, `data: T`
- `errorState(error)` - error state, `isError: true`

Two operators wrap async work into `FetchState<T>` (both in `src/app/utils/operators/state.ts`):

- `mapToFetchState()` — applied at the END of a one-shot pipeline (typical effect: an HTTP service
  that emits once and completes). On error, the upstream completes; recovery requires a `resetter`.
- `switchMapToFetchState(fetchFn, config?)` — applied to an INPUTS observable (e.g.,
  `combineLatest` of subjects + ngrx selectors). `catchError` lives inside the per-input
  `switchMap`, so the outer subscription stays alive across errors and a new input emission (or
  a `resetter` emission) re-runs `fetchFn` automatically.

Use `mapToFetchState` for one-shot effects. Use `switchMapToFetchState` when a component pipeline
can re-emit and must auto-retry after a previous failure (e.g., `ChapterChildrenComponent`).

## Data Flow

```
Component -> Action -> Effect -> API Service -> Effect -> Action -> Reducer -> Selector -> Component
```

1. Components dispatch actions
2. Effects intercept actions and call API services
3. API services return observables
4. Effects dispatch success/failure actions
5. Reducers update state
6. Selectors provide derived state to components

## API Integration

### HTTP Services (`data-access/`)

- Services use `HttpClient` and return `Observable`
- Response validation with Zod schemas
- Snake_case to camelCase conversion via `decodeSnakeCase` operator
- API URL configured via `APPCONFIG` injection token
- Transient HTTP failures (status 0, 5xx, RxJS `TimeoutError`) can be retried with bounded
  exponential backoff via the `retryOnTransientError()` operator
  (`src/app/utils/operators/retry-on-transient-error.ts`). Applied per-service (not globally) to
  avoid retrying non-idempotent mutations. Must be piped above schema parsing so contract failures
  are not retried.

### Interceptors

- `authentication.interceptor.ts`: Adds auth tokens to requests (only for `apiUrl`)
- `time_offset.interceptor.ts`: Handles server time synchronization
- `timeout.interceptor.ts`: Request timeout handling
- `with_credentials.interceptor.ts`: Cookie-based auth support

### SLS API

The SLS (serverless) API is separate from the main backend API:
- Configured via `slsApiUrl` in config
- Auth interceptor does NOT handle SLS requests
- Use `IdentityTokenService.identityToken$` to get the bearer token manually for user-level requests
- Use thread tokens from the store for thread-specific operations (e.g., posting, following)
- Example endpoints: notifications, websocket connections, thread following

## Routing

### Main Routes

| Path | Module | Description |
|------|--------|-------------|
| `/` | Home redirect | Redirects to default activity |
| `/community/*` | Community | Community section (requires `community` flag not `'disabled'`) |
| `/a/:idOrAlias` | Items | Activity content |
| `/s/:idOrAlias` | Items | Skill content |
| `/groups/*` | Groups | Group management |
| `/lti/:contentId` | LTI | LTI integration |
| `/r/**` | Redirect | Path-based redirects |

### Route Parameters

Items support complex routing with:
- `path`: Navigation breadcrumb path
- `parentAttemptId`: Attempt context
- `observedGroupId`: Observation mode

## Configuration

Configuration is loaded from `src/assets/config.js` at runtime:

```typescript
interface AppConfig {
  apiUrl: string;              // Backend API URL
  oauthServerUrl: string;      // OAuth server URL
  oauthClientId: string;       // OAuth client ID
  defaultActivityId: string;   // Home activity ID
  defaultSkillId?: string;     // Root skill ID
  allUsersGroupId: string;     // All-users group ID
  languages: Language[];       // Supported languages
  featureFlags: {
    enableForum: boolean;        // default false
    community: 'disabled' | 'notInNav' | 'enabled'; // default 'disabled' — gates /community route and nav tab
    enableNotifications: boolean;
    // …
  };
  theme: string;               // UI theme
}
```

## Authentication

Two auth modes supported (configured via `authType`):
- **cookies**: Session-based authentication
- **tokens**: JWT token authentication

Auth flow handled by `AuthService` and `OAuthService` in `services/auth/`.

## Internationalization

- Built-in Angular i18n with `@angular/localize`
- Translations managed via Crowdin
- Locale detection via URL path prefix
- Supported languages configured in `config.js`

## Build & Deployment

### Asset hosting via `--deploy-url`

Production builds are served from a CDN (`static5.algorea.org` for tagged
releases, `assets.algorea.org` for branch/master builds), while the HTML
shell is served from the SPA host (e.g. `parcours.algorea.org`). The split
is implemented in `.circleci/config.yml` via Angular's `--deploy-url` flag,
which prefixes asset URLs in `index.html` and external CSS files with the
CDN origin.

### Critical CSS inlining disabled in production

In each `production-*` configuration in `angular.json`, the `optimization`
option is an object with `styles.inlineCritical: false` (instead of `true`,
which is the Angular default). This is a workaround, not a long-term choice:

- Angular rewrites `url()` paths in external CSS files to honor
  `--deploy-url`, but the critical-CSS inliner (`beasties`) re-emits the
  selected `@font-face` rules **inside `index.html`** with their original
  relative paths (e.g. `./media/roboto-v30-latin-regular.woff2`).
- Those relative paths resolve against the document URL (the SPA host),
  not the CDN. The SPA host falls back to `index.html` for unknown routes,
  so the browser receives HTML where it expects a font, and Firefox's font
  sanitizer rejects it.
- Disabling inlining keeps all `@font-face` rules in the external stylesheet
  (where `url()` rewriting works correctly). FOUC is mitigated by the
  existing `<link rel="preload">` font tags in `src/index.html` (rewritten
  to the CDN by `npm run injectDeployUrlForAssets`) plus `font-display: swap`.

This should be reverted to `"optimization": true` once the underlying
issue is resolved — either by Angular/`beasties` honoring `--deploy-url`
when inlining critical CSS, or by serving HTML and assets from the same
origin (which would also let us drop the deprecated `--deploy-url` flag).

## Key Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Authentication state and flow |
| `UserSessionService` | Current user session management |
| `LayoutService` | UI layout state (left menu, breadcrumbs) |
| `LocaleService` | Language/locale management |
| `ItemNavTreeService` | Item navigation tree building |
| `GroupNavTreeService` | Group navigation tree building |
| `NotificationHttpService` | Fetch and manage user notifications from SLS API |
| `ThreadFollowService` | Follow/unfollow forum threads (SLS API) |
| `IdentityTokenService` | Manage user identity tokens for SLS API |
| `WebsocketClient` | WebSocket connection management |

## Notifications & WebSocket

### Notification System

- Real-time notifications via WebSocket (SLS API)
- Notification bell component in top bar with unread count badge
- Dropdown panel showing forum message notifications
- Toast notifications for new messages (clickable to open thread)
- Notifications automatically cleared when visiting the relevant thread
- Controlled by `enableNotifications` feature flag

### WebSocket Architecture

The WebSocket connection is managed at the root store level:
- `websocket` store tracks connection state (open/closed)
- Effects in feature stores subscribe to WebSocket messages
- Forum threads subscribe/unsubscribe based on visibility
- Notifications are received via WebSocket and stored in root `notification` store

### Thread Following

- Users can follow/unfollow forum threads they don't own
- Follow status fetched from SLS API when viewing a thread
- Auto-follow when posting a message to a thread
- Thread tokens (not identity tokens) required for follow operations

## Item descriptions (sandboxed iframe rendering)

Stored item descriptions (`item.string.description`) and the editor Parameters **Preview** tab render HTML through `alg-description-iframe` instead of `[innerHTML]` on the host page.

- **Where**: `ItemContentComponent` (chapter/skill descriptions) and `PreviewHtmlComponent` (preview panel).
- **Mechanism**: A sandboxed `<iframe>` with `srcdoc` composed of a small HTML shell, injected base CSS (`description-iframe.styles.ts`), and the author HTML. Plain-text descriptions (no HTML element nodes, same rule as `algHasHTML`) are escaped and wrapped in `<p>` so they pick up the same reading-width typography as paragraphs in authored HTML. On the item page the Content tab keeps the regular `.content-container` top padding so the spacing between the tab bar and the chapter children is preserved whether or not a description is present (the iframe `body` itself has no extra top padding, otherwise it would stack on top of the outer one). `sandbox="allow-scripts"` is used **without** `allow-same-origin`, so the document keeps an opaque origin: scripts can run, but the iframe cannot access parent cookies, storage, or the parent DOM.
- **Sanitization**: `DomSanitizer.bypassSecurityTrustHtml` is applied only to the iframe `srcdoc`, never to bindings in the Angular app shell.
- **Base CSS**: A bundled subset of `--alg-*` tokens (aligned with `src/variables.scss`) and typography rules approximate former `.html-container` styling so plain markup stays on-brand; authors can override via their own CSS inside the description. The iframe uses the parent content width; default prose uses `--description-reading-max-width` (57.5rem / 920px) on `p`, headings, lists, `blockquote`, and `pre`. Tables stay full width of the iframe. A `.full-width` opt-in utility class (with `max-width: 100% !important`) is bundled so authors can lift the cap per element without writing their own CSS; the whole cap can also be lifted by overriding `--description-reading-max-width` on `:root`. Both are documented in the editor's "help" panel (`item-edit-content-help`). Layout spacing under the block is handled on `alg-description-iframe` (`:host`), not via legacy `.description` classes on the parent page.
- **Theming**: The iframe is opaque-origin so parent stylesheets cannot reach inside; theme overrides from `src/assets/scss/themes/*.scss` (`thymio`, `probabl`, `coursera-pt`) are inlined into `descriptionBaseCss` and matched via `data-theme` set on the inner `<html>`. Custom web fonts referenced by themes (Poppins, Geist, Source Sans Pro) are not loaded inside the iframe and fall back to the next available family; if the design needs the exact face inside descriptions, declare `@font-face` (or a `<link>` to the CDN) inside `descriptionBaseCss`. Keep this list in sync when a new theme is added.
- **Hygiene**: `referrerpolicy="no-referrer"` and `loading="lazy"` on the iframe. Height is no longer fixed (see v2 messaging-protocol below); the iframe never scrolls — the parent grows it.

### v2 messaging protocol (iframe → parent)

Lightweight `postMessage` channel between the sandboxed description iframe and `alg-description-iframe`. Three fire-and-forget messages, validated parent-side with zod schemas in [src/app/ui-components/description-iframe/description-iframe.messages.ts](../src/app/ui-components/description-iframe/description-iframe.messages.ts):

- `{ type: 'alg.updateDisplay', data: { height: number } }` — sent on every content size change. Parent writes the inline `style.height` accordingly and, on the very first message, drops the `--alg-description-iframe-min-height` floor (which was a *loading-only* placeholder, ~200px by default) so short descriptions are also free to collapse. Combined with `html, body { overflow: hidden }` in the base CSS, the iframe is never scrollable from the inside.
- `{ type: 'alg.navigate', data: { itemId, child? } | { url } }` — request a navigation. `union` of the two variants; consumers narrow with `'url' in req` / `'itemId' in req`. The `url` variant only accepts absolute `http(s)` URLs (validated parent-side via `new URL(...)` + protocol allowlist) — relative paths, `javascript:`, `data:`, `mailto:`, `tel:`, etc. are silently dropped. This is defense in depth: the runtime helper already filters `javascript:` hrefs, but an author with script access could `parent.postMessage(...)` directly. Internal navigation must go through `data-item-id` instead of relative URLs.
- `{ type: 'alg.scrollIntoView', data: { offset: number } }` — sent when an in-page hash anchor is clicked inside the iframe. The offset is the target element's Y position from the top of the iframe document (CSS px). Parent walks up from the iframe to the nearest scrollable ancestor (`overflow-y: auto|scroll`) and scrolls it so the target lands at the top, falling back to `window.scrollTo` if no scrollable ancestor is found. **Why we can't just let the browser handle the hash**: in `srcdoc` iframes, fragment navigation actually navigates to `about:srcdoc#name` (a blank document), wiping the description body — and even if it didn't, `overflow: hidden` would prevent any in-frame scroll from being visible. The helper resolves targets by `id` first, then by the legacy `name` attribute (`<a name="…">`).

#### Source filter (no `event.origin`)

The iframe runs `sandbox="allow-scripts"` (no `allow-same-origin`), so the document has an opaque origin and `event.origin` is the literal string `"null"`. The parent listener compares `event.source === iframeRef.nativeElement.contentWindow` instead — the only reliable filter under opaque origin. Any inbound message failing this check or zod validation is silently dropped.

#### Auto-injected runtime helper (no `import` for authors)

A vanilla-JS helper ([description-iframe.runtime.ts](../src/app/ui-components/description-iframe/description-iframe.runtime.ts)) is inlined as a `<script>` in every srcdoc. It:

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

#### External-URL handling: heads-up toast + delayed auto-open

When `ItemContentComponent.onDescriptionNavigate` receives a `{ url }` payload:

1. An info toast is shown via `MessageService` ("Navigating to an external link" + the URL itself, default 5s lifetime).
2. The URL auto-opens in a new tab after **900 ms**, deliberately inside the browser's ~1s "transient user activation" window so popup blockers stand down. If a future browser tightens that window, the click handler on the toast remains as a user-gesture fallback.
3. Both paths converge through a `merge(clicked$, timer(900)).pipe(take(1))` so the tab is opened at most once.

#### Preview surface

`PreviewHtmlComponent` deliberately does **not** route — the preview tab is for editing a (possibly unsaved) item. It instead surfaces every `navigationRequested` event as an info toast describing the intended target, so editors can validate that their `data-item-id` / `data-child` / `data-url` anchors are wired correctly.

The description editor (`ItemEditContentComponent`) exposes a third **Help** tab next to *Write* / *Preview*. It hosts `alg-item-edit-content-help`, a static, fully-i18n component that documents what authors can put in a description (HTML/CSS/JS in the sandbox, allowed link patterns, dropped schemes) and the `postMessage` protocol for scripted navigation/scrolling/height. Keep its examples in sync when extending the v2 messaging protocol.

#### Why vanilla over penpal

Both messages are notifications, not RPC; the helper is ~30 lines and adds no new runtime dep (zod is already bundled). A future surface that genuinely needs request/response semantics could layer one on top without breaking this protocol. Tasks (which need RPC: `grade`, `getAnswer`, `validate`) keep using `jschannel` via [task-proxy.ts](../src/app/items/api/task-proxy.ts).

## Testing

- **Unit tests**: Jasmine + Karma (`ng test`)
- **E2E tests**: Playwright (`npm run test:e2e`)
- Test files co-located with source (`*.spec.ts`)
