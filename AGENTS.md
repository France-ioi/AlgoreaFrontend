You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

# Project Overview

Algorea Frontend is an educational platform built with Angular 20 and ngrx. The project supports internationalization via Crowdin.

The architecture of the project is documented in `.cursor/ARCHITECTURE.md`.

# Code quality

- files should not be longer than 300 lines.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Explicit return types are required on functions
- Use single quotes for strings

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for local component state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- Component selector prefix: `alg` (kebab-case)
- Directive selector prefix: `alg` (camelCase)

## Linting
- Linting rules are defined in the `.eslintrc.js` file
- Use `.editorconfig` file for basic editor config
- Max line length: 140 characters

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
- Use the `inject()` function instead of constructor injection

## State Management

- Use ngrx Store for global state management
- Use ngrx Effects for side effects
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Our other preferences:
- Do NOT use promises, use RxJS instead

# Dev workflow

## Development server

- Run `ng serve` for dev server at `http://localhost:4200/`
- Run `npm start` to run both mock server and Angular serve together
- For mock server, copy `mocks/environment.dev.ts` to `mocks/environment.ts` and update the dev token

## Linting and tests

Make sure after each modification that:
- the linting (`ng lint`) pass
- the unit tests pass (`ng test`)
- the e2e tests pass (`npm run test:e2e`)

## E2E tests

- E2E tests use Playwright
- Set the user token in `.e2e.env` (start from `.e2e.env.sample`)
- Launch web server (`ng serve`) before running tests

## Internationalization

- All English strings in templates and code must be internationalized
- Use Angular i18n markers for all translatable strings
- Translated strings are managed via Crowdin
- New strings are pushed to Crowdin when merged to `master`

## Documentation and architecture

- The `.cursor/ARCHITECTURE.md` document must be updated each time a change may affect the global app architecture
- Keep the architecture document shorter than 1000 lines
