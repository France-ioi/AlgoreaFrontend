# Algorea Frontend Architecture

## Overview

Algorea Frontend is an Angular 22 educational platform for learning activities, skills, groups, and user progress. It uses ngrx for state management and communicates with a backend API. Change detection is **zoneless** (`provideZonelessChangeDetection` in `src/main.ts`; Zone.js is not loaded).

Toolchain: Node ≥ 24.16.0 (`engines` / `mise.toml`), npm. Setup: `mise install` then `npm install` (see `README.md`).

## Feature deep-dives

Keep this file as the map. Put branch-specific detail beside it in this folder and link it here. Read a deep-dive only when the change touches that branch:

| Branch | Doc |
|--------|-----|
| Left panel / tabs / nav tree / narrow layout | [left-nav.md](left-nav.md) |
| Item editor Parameters tab, display settings, strings save | [item-parameters-form.md](item-parameters-form.md) |
| Item URL attempts / breadcrumbs / explicit entry | [item-routing.md](item-routing.md) |
| Description iframe, `postMessage` protocol, preview/help | [item-descriptions.md](item-descriptions.md) |
| Bebras task load/token/views, device proxy, unload, test-task | [task-platform.md](task-platform.md) |
| Notification bell/toasts, export UX, WebSocket, thread follow | [notifications.md](notifications.md) |
| CDN `--deploy-url`, critical CSS, app-version check | [build-deploy.md](build-deploy.md) |
| Cookie/token auth, cross-tab Web Lock | [auth.md](auth.md) |

When a change affects global structure (folders, root store shape, routes table, config shape, shared patterns), update **this** file. When it only deepens one branch above, update that deep-dive.

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
├── community/           # Community feature module (gated by a `community` entry in `leftMenuTabs`)
└── lti/                 # LTI integration module
```

## Core Concepts

### Items

Items are learning content: **Activities** (tasks, chapters, courses) and **Skills** (competency tracking). Routes: `/a/:idOrAlias`, `/s/:idOrAlias`.

Display-related per-item settings live in `Item.displaySettings` (camelCase object decoded from `display_settings`, with Zod defaults in `displaySettingsSchema`). Write via `display_settings` on `ItemChanges` using `buildDisplaySettingsBody()`.

Parameters editor, children layout, and strings save: [item-parameters-form.md](item-parameters-form.md). Attempt URL / breadcrumbs: [item-routing.md](item-routing.md). Description HTML: [item-descriptions.md](item-descriptions.md). Task iframe: [task-platform.md](task-platform.md).

### Groups

Organizational units: **Users**, **Teams**, **Classes**. Routes: `/groups/by-id/:id`, `/groups/users/:id`.

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
├── feature.actions.ts
├── feature.effects.ts
├── feature.reducer.ts
├── feature.selectors.ts
├── feature.state.ts
└── feature.store.ts      # createFeature() export
```

Stores are exported via `fromFeature` namespace (e.g., `fromItemContent`, `fromGroupContent`).

### FetchState Pattern

Async state uses `FetchState<T>` from `src/app/utils/state.ts`:

```typescript
type FetchState<T> = Ready<T> | Fetching<T> | FetchError;
```

- `fetchingState()` — loading (`isFetching: true`)
- `readyState(data)` — success (`isReady: true`, `data: T`)
- `errorState(error)` — error (`isError: true`)

Two operators wrap async work into `FetchState<T>` (both in `src/app/utils/operators/state.ts`):

- `mapToFetchState()` — end of a one-shot pipeline (typical effect: HTTP emits once and completes). On error, upstream completes; recovery needs a `resetter`.
- `switchMapToFetchState(fetchFn, config?)` — on an INPUTS observable. `catchError` lives inside the per-input `switchMap`, so the outer subscription stays alive and a new input (or `resetter`) re-runs `fetchFn`.

Use `mapToFetchState` for one-shot effects. Use `switchMapToFetchState` when a component pipeline can re-emit and must auto-retry after failure (e.g., `ChapterChildrenComponent`).

### Subscription teardown

Long-lived classes that call `.subscribe()` must tear down on destroy. Prefer:

1. **`takeUntilDestroyed()`** — field initializers / constructors (injection context).
2. **`takeUntilDestroyed(destroyRef)`** — subscriptions from later methods; inject `DestroyRef`.
3. **`async` pipe / `toSignal()`** — when the template or signal consumer owns the subscription.
4. **`take(1)` / `first()`** — only when a single emission is enough *and* a late callback on a destroyed host is acceptable (rare for UI side effects).

Do **not** rely on finite HTTP completion alone for action handlers that update component state or open UI: the request can outlive the component. Guarding with `takeUntilDestroyed` cancels in-flight `HttpClient` work on destroy — mutations that must finish after navigation belong in a root service or ngrx effect. Manual `Subscription.unsubscribe()` / `destroyed$` subjects are legacy; convert when touching the code.

`eslint-plugin-rxjs-x` has no `prefer-takeuntil` rule, so this convention is documented rather than lint-enforced.

## Data Flow

```
Component -> Action -> Effect -> API Service -> Effect -> Action -> Reducer -> Selector -> Component
```

## API Integration

### HTTP Services (`data-access/`)

- `HttpClient` returning `Observable`; Zod response validation; `decodeSnakeCase` for snake→camel
- API URL via `APPCONFIG`
- Transient failures (status 0, 5xx, RxJS `TimeoutError`) may use `retryOnTransientError()` (`src/app/utils/operators/retry-on-transient-error.ts`) — per-service, not global; pipe above schema parsing so contract failures are not retried

### Interceptors

- `authentication.interceptor.ts`: auth tokens for `apiUrl` only
- `time_offset.interceptor.ts`: server time sync
- `timeout.interceptor.ts`: request timeout
- `with_credentials.interceptor.ts`: cookie auth

### SLS API

Separate from the main backend (`slsApiUrl`). Auth interceptor does **not** handle SLS: use `IdentityTokenService.identityToken$` for user-level requests, thread tokens from the store for thread operations. Examples: notifications, websocket, thread following. Details: [notifications.md](notifications.md).

## Routing

| Path | Module | Description |
|------|--------|-------------|
| `/` | Home redirect | Redirects to default activity |
| `/community/*` | Community | Requires a `community` entry in `leftMenuTabs` |
| `/a/:idOrAlias` | Items | Activity content |
| `/s/:idOrAlias` | Items | Skill content |
| `/groups/*` | Groups | Group management |
| `/lti/:contentId` | LTI | LTI integration |
| `/r/**` | Redirect | Path-based redirects |

Item attempt / path / observation params: [item-routing.md](item-routing.md).

## Configuration

Loaded from `src/assets/config.js` at runtime:

```typescript
interface AppConfig {
  apiUrl: string;
  oauthServerUrl: string;
  oauthClientId: string;
  defaultActivityId: string;
  allUsersGroupId: string;
  leftMenuTabs: Array<
    | { type: 'activities'; showTo: UserSet; content: { id: string; path: string[] }; caption?: { default: string; [lang: string]: string }; icon?: string }
    | { type: 'skills'; showTo: UserSet; content: { id: string; path: string[] }; caption?: { default: string; [lang: string]: string }; icon?: string }
    | { type: 'groups' | 'community' | 'search'; showTo: UserSet; caption?: { default: string; [lang: string]: string }; icon?: string }
  >;
  languages: Language[];
  featureFlags: {
    enableForum: boolean;        // default false
    enableNotifications: boolean;
    // …
  };
}
```

Left-menu tab behaviour: [left-nav.md](left-nav.md). Auth modes: [auth.md](auth.md).

## Internationalization

Angular i18n (`@angular/localize`) + Crowdin; locale via URL path prefix; languages in `config.js`. Temp users: `LanguageMismatchComponent` auto-aligns once per load via `UserLanguageService` when profile `defaultLanguage` differs from the site language; logged-in users get the language-mismatch modal.

## Key Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Authentication state and flow |
| `UserSessionService` | Current user session |
| `UserLanguageService` | Persist profile language; force nav-menu reload |
| `LayoutService` | Left menu, breadcrumbs |
| `LocaleService` | Language/locale |
| `ItemNavTreeService` / `GroupNavTreeService` | Nav trees |
| `AppVersionCheckService` | Soft new-build check after long hide/sleep |
| `NotificationHttpService` / `NotificationInteractionService` | SLS notifications |
| `GroupResultsExportService` | Async group-results ZIP (backend token + SLS) |
| `ThreadFollowService` | Follow/unfollow threads (SLS) |
| `IdentityTokenService` | Identity tokens for SLS |
| `WebsocketClient` | WebSocket connection |

## Testing

- Unit: Jasmine + Karma (`ng test`); files co-located (`*.spec.ts`)
- E2E: Playwright (`npm run test:e2e`)
- Platform↔task: [task-platform.md](task-platform.md) and [mocks/test-task/README.md](../../mocks/test-task/README.md)
