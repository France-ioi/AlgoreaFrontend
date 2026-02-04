# Algorea Frontend Architecture

## Overview

Algorea Frontend is an Angular 20 educational platform that provides features for managing learning activities, skills, groups, and user progress. It uses ngrx for state management and communicates with a backend API.

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
└── lti/                 # LTI integration module
```

## Core Concepts

### Items
Items represent learning content and can be:
- **Activities**: Tasks, chapters, courses
- **Skills**: Competency tracking

Items are accessed via routes like `/a/:idOrAlias` (activities) or `/s/:idOrAlias` (skills).

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

Use `mapToFetchState()` operator in effects to handle the full fetch lifecycle.

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
  featureFlags: FeatureFlags;  // Feature toggles
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

## Testing

- **Unit tests**: Jasmine + Karma (`ng test`)
- **E2E tests**: Playwright (`npm run test:e2e`)
- Test files co-located with source (`*.spec.ts`)
