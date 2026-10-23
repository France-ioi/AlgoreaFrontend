You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

# Project Overview

Algorea Frontend is an educational platform built with Angular 22 and ngrx, internationalized via Crowdin. Change detection is zoneless.

**Architecture map:** [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) — folders, store shape, FetchState, API/routing/config. Feature deep-dives in the same folder (left nav, item parameters, item routing, descriptions iframe, task↔platform, notifications, build/deploy, auth). Read the map when structure or shared patterns change; read a deep-dive only when that branch is in scope. Update the file you changed.

# Code quality

- Files ≤ 300 lines.

## Comments

Comment non-obvious choices (algorithm trade-off, hardcoded threshold, framework quirk, intentional omission). Skip narrating comments. When refactoring, **preserve** existing explanatory comments (move with the code); remove only when factually obsolete.

## TypeScript

- Strict checking; prefer inference when obvious; `unknown` over `any`
- Explicit return types on functions
- Single quotes for strings
- RxJS over promises

## Angular

- Standalone components (do not set `standalone: true` — default in v20+)
- Signals for local state; `computed()` for derived state; `update`/`set` on signals (not `mutate`)
- Lazy-load feature routes
- Host bindings via the `host` object on `@Component` / `@Directive` (not `@HostBinding` / `@HostListener`)
- `NgOptimizedImage` for static images (not inline base64)
- Selectors: components `alg` kebab-case; directives `alg` camelCase
- `inject()` over constructor injection
- Reactive forms over template-driven
- Self-closing tags for empty components/elements; open/close when there is projected or inner content
- Native control flow (`@if` / `@for` / `@switch`); `class` / `style` bindings (not `ngClass` / `ngStyle`)
- Paths for external templates/styles relative to the component TS file
- Prefer inline templates for small components

### Change detection & modernization

- Omit `ChangeDetectionStrategy.OnPush` (default in Angular 22). Set `ChangeDetectionStrategy.Eager` only when a component must run every cycle (legacy).
- When modernizing legacy components (projection vs inputs, migration order), check for [`.cursor/MODERNIZING-COMPONENTS.md`](.cursor/MODERNIZING-COMPONENTS.md) if present.

### Accessibility

Pass AXE checks and WCAG AA (focus, contrast, ARIA).

## Styling

- Tokens in `src/variables.scss` (overridable per customer at deploy — see architecture map). Primary: `--alg-primary-color` (not `--alg-primary`). Always provide CSS-variable fallbacks.
- `functions.toRem()` for lengths; `@use 'src/assets/scss/functions'` at top of SCSS.
- Component-owned `:host` / class bindings instead of `::ng-deep`; host styles live on the owning component.

## State (ngrx + local)

- ngrx Store for global state; Effects for side effects; signals for local component state
- Async state: `FetchState<T>` + `fetchingState()` / `readyState(data)` / `errorState(error)` from `src/app/utils/state.ts`
- Prefer one `fetchStateChanged` action carrying full `FetchState` over separate success/failure actions
- Store imports from feature index files (e.g. `import { fromNotification } from './store/notification'`)
- Operator choice and subscription teardown: architecture map (`FetchState` / teardown sections)

## Templates

Keep logic out of templates. Use the async pipe for observables. No `new Date()` (or other globals) and no arrow functions in templates.

## Services

Single responsibility; `providedIn: 'root'` for singletons; `inject()`.

## Linting

Max line length 140. Config lives in the repo ESLint / EditorConfig files.

# Dev workflow

- Dev server: `ng serve` → `http://localhost:4200/`. `npm start` runs mock server + serve. Mock env: copy `mocks/environment.dev.ts` → `mocks/environment.ts` and set the token.
- After changes: `npm run lint`, `ng test`, and `npm run test:e2e` must pass.
- E2E: Playwright; token in `.e2e.env` (from `.e2e.env.sample`); `ng serve` must be up.
- **Platform↔task** (`src/app/items/api/` or `item-task-*`): keep [mocks/test-task/](mocks/test-task/) in sync; manual check via `npm start` + task URL `http://localhost:3000/test-task/index.html`; cover in [e2e/items/task-platform-interaction.spec.ts](e2e/items/task-platform-interaction.spec.ts). Details: [mocks/test-task/README.md](mocks/test-task/README.md) and [docs/architecture/task-platform.md](docs/architecture/task-platform.md).

## Internationalization

Internationalize all English UI strings with Angular i18n markers. Crowdin owns translations; new strings ship to Crowdin on merge to `master`.

# Agent skills

- **Issue tracker:** markdown under `.scratch/<feature>/` — [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md)
- **Triage labels:** `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` — [docs/agents/triage-labels.md](docs/agents/triage-labels.md)
- **Domain docs:** root `GLOSSARY.md` + `docs/adr/` (+ Algorea knowledge base) — [docs/agents/domain.md](docs/agents/domain.md)
