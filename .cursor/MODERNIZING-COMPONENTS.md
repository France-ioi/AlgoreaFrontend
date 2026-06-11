# Modernizing Angular components (Algorea Frontend)

Guide for migrating legacy components to modern Angular 22 patterns: signal inputs/outputs, `computed()`, template cleanup, and safe change detection. Use this when converting `@Input` / `@Output` components or when touching leaf `ui-components`.

Project conventions also live in [AGENTS.md](../AGENTS.md).

---

## 1. Where to start

**Default strategy: bottom-up.**

| Priority | Layer | Why |
|----------|-------|-----|
| 1 | Shared `ui-components/` | High reuse, small blast radius |
| 2 | Leaf feature components | Presentational, few store/router deps |
| 3 | Feature containers | Store, `toSignal()`, orchestration |
| 4 | App shell | Last, unless refactoring app-wide CD |

**Why leaf-first:** `input()` / `output()` are drop-in at the template boundary. Parents with `@Input()` can bind to children with `input()` unchanged. Mixed old/new APIs during transition is fine.

**When to use a vertical slice instead:** you are already refactoring one feature’s data flow (store → signals → children) and want one coherent PR.

---

## 2. Per-component checklist

Apply in order for each component:

### TypeScript

- [ ] `@Input()` → `input()` / `input.required<T>()` — grep call sites and re-evaluate each legacy optional/default (see §4); do not copy `= ''` / `= []` / `?` blindly
- [ ] `@Output()` + `EventEmitter` → `output<T>()`
- [ ] Constructor injection → `inject()` (when touching the file)
- [ ] `ngOnChanges` / derived fields → `computed()`; remove `OnChanges`, `SimpleChanges`
- [ ] `@ContentChild` → `contentChild()` (signal query)
- [ ] Remove `standalone: true` (default since v20; do not set it)
- [ ] Remove empty `imports: []`
- [ ] Do **not** set `changeDetection: ChangeDetectionStrategy.OnPush` (default in Angular 22)
- [ ] Set `ChangeDetectionStrategy.Eager` **only** if the component relied on always-check behavior and still needs it after migration (legacy; most of the codebase still uses `Eager` on older files)
- [ ] Remove dead `@Input()` / `@Output()` and clean up parent bindings that passed them
- [ ] Preserve existing explanatory comments (move if code moved; delete only if obsolete)

### Template

- [ ] Every signal input / computed in templates: call it — `caption()` not `caption`
- [ ] `[ngClass]="x"` → `[class]="x()"` or `[class.foo]="cond()"`
- [ ] `[ngStyle]="{ width: x }"` → `[style.width.px]="x()"` (or `.rem`, etc.)
- [ ] Remove unused `NgClass`, `NgStyle` imports
- [ ] Do not mix `[attr.class]` and `[class]` on the same element (they fight over the DOM `class` attribute). Prefer static `class="…"`, theme via `[class.success]` / `[class.warning]`, extras via `[class]="styleClass()"`

### Tests

- [ ] Creation-only specs: if any input is `input.required()`, set it with `fixture.componentRef.setInput('name', value)` before `detectChanges()`
- [ ] Run `npm run lint` and targeted `ng test` for touched specs

### After migration

- [ ] Grep parents for `@ViewChild(…).someInput` — signal inputs are not readable as plain properties on the class instance
- [ ] Grep for dead attributes on the selector (e.g. `icon="…"` on a component that has no `icon` input)
- [ ] Check e2e coverage (see §7)

---

## 3. Change detection (Angular 22)

In Angular 22, **OnPush is the default** for new/migrated components. You do not need to write it in the decorator.

Only opt into explicit CD when needed:

```ts
// Legacy always-check — use sparingly, document why
changeDetection: ChangeDetectionStrategy.Eager,
```

Most pre-migration components used `ChangeDetectionStrategy.Eager` (formerly `Default`). When modernizing, **do not blindly keep Eager** unless you verify the component still needs always-check (e.g. heavy reliance on mutable state without signals).

---

## 4. Inputs: optional vs `input.required()`

Use `input.required<T>()` when **every real call site always provides a value** and an empty/missing value would be a bug.

### Re-evaluate optional inputs during migration

Legacy `@Input()` had **no compile-time or runtime enforcement** of required inputs. An optional-looking API often reflects that limitation, not a deliberate design choice:

- `@Input() header = ''` — default empty string, not proof that omitting `header` is valid.
- `@Input() values: T[] = []` — default empty array, not proof that callers may skip `values`.
- `@Input() foo?: T` — TypeScript optional, but every parent may still pass `foo` anyway.

**While modernizing, treat each former `@Input()` as a candidate for `input.required()`** unless you find a real reason to keep it optional (template fallback, intentional default, or call sites that omit it). Grep call sites; do not assume the old optional/default was correct.

Recent examples from batch 4 (`collapsible-section` family):

| Input | Old API | After grep | Decision |
|-------|---------|------------|----------|
| `collapsible-section` `header` / `icon` | `input('')` | All 17 call sites set both | `input.required()` |
| `progress-select` `values` | `input([])` | All 9 call sites bind `[values]` | `input.required()` |
| `collapsible-section` `errorMessage` | optional | Several sections omit it | keep optional |

| Use `input.required` | Keep optional `input()` |
|----------------------|-------------------------|
| `empty-content` `icon` / `message` | `error` `message` (projection fallback) |
| `sub-section` `label` | `error` `icon` (many text-only errors) |
| `left-menu-back-button` `title` | `message-info` `icon` (has default) |
| | `score-ring` scores (defaults like `0` are valid) |

**Do not** make an input required if the template supports an alternative (e.g. `error` uses `message()` **or** `<ng-content>` when `!message()`).

Before marking required, grep all usages:

```bash
rg 'alg-my-component' src -g '*.html'
```

Also check for static attributes on the selector (`header="…"`, `icon="…"`) — i18n markers often use `i18n-header` / `header="…"` instead of `[header]="…"`.

Do **not** skip this step because the legacy input had a default or was typed optional.

---

## 5. Content projection vs signal inputs (critical)

### The mistake we hit

`left-menu-back-button` projected `{{ parent.title }}` via `<ng-content>`. After migration (OnPush by default), e2e failed: the back button did not reliably show the parent title after tree navigation.

**Fix:** dynamic strings → signal input:

```ts
title = input.required<string>();
```

```html
<p class="back-button-title">{{ title() }}</p>
```

Parent:

```html
<alg-left-menu-back-button [title]="parent.title" … />
```

### Decision rules

| Content type | Prefer |
|--------------|--------|
| Dynamic **string/number** from parent | `input()` / `input.required()` |
| Rich markup, i18n blocks, links, `@if` in parent | `<ng-content>` (keep projection) |
| Structural slot (child components) | `<ng-content>` (composition) |
| Named template region | `contentChild('ref')` + `ng-template` |

### When is `ng-content` still safe?

Projection is compiled in the **parent’s** view. If the parent is **`ChangeDetectionStrategy.Eager`** (most containers today), projected content usually updates even when the child is OnPush.

**Risk rises when:**

1. Child is OnPush (default), and
2. Content is dynamic **only** via projection (no signal input on the child), and
3. Parent is **also** OnPush **or** does not re-render when content should change, and
4. Child inputs (`icon`, etc.) stay the same between updates

**Rule of thumb:** if the only thing changing is projected text, use a signal **input**, not `ng-content`.

### Components in this repo with intentional projection

- **`error`:** `[message]="…"` **or** `<ng-content>` — keep both; OnPush parents should use `message`, not projection only
- **`message-info`:** body always projected — OK under Eager parents; dynamic lists also change `[icon]` / `[closable]`
- **`sub-section`:** slots `alg-add-content` — composition, not dynamic strings

---

## 6. Derived state: `computed()` not `ngOnChanges`

```ts
// Before
totalArray: number[] = [];
ngOnChanges(): void {
  this.totalArray = [ ...Array(this.valuesLength - 1).keys() ];
}

// After
protected readonly totalArray = computed(() =>
  [ ...Array(this.valuesLength() - 1).keys() ],
);
```

Same for SVG paths, clamped values, merged class maps, etc. Keep pure helpers private; expose `computed()` to the template.

---

## 7. Verification

### Lint and unit tests

```bash
npm run lint
CHROME_BIN=/usr/bin/chromium npm test -- --include='**/ui-components/**/*.spec.ts' --watch=false --browsers=ChromeHeadless
```

### E2e

After `ui-components` changes, check whether specs target your selector:

```bash
rg 'alg-my-component' e2e
```

Prefer stable selectors (e.g. `.back-button-title`) over brittle text queries when the DOM structure is known.

| Coverage | Action |
|----------|--------|
| Direct e2e on selector | Rely on CI |
| Indirect / partial | Manual smoke or tighten assertion |
| None | Manual smoke checklist |

### Build

Confirm template type-checking: signal calls in templates (`ng serve` / `ng build`).

---

## 8. Common cleanups while migrating

- Remove **`@deprecated` inputs** unused in template and at all call sites (grep parents).
- Remove **ignored host attributes** on the selector (e.g. `icon="…"` on a component with no `icon` input).
- Fix **class binding conflicts** (`[attr.class]` + `[ngClass]` / `[class]` on one node).
- Drop **`imports: []`** when the array is empty.

---

## 9. Example: minimal leaf component

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'alg-code-token',
  templateUrl: './code-token.component.html',
  styleUrls: [ './code-token.component.scss' ],
  imports: [ ButtonIconComponent, TooltipDirective ],
})
export class CodeTokenComponent {
  showRefresh = input(true);
  showRemove = input(false);
  code = input('...');

  refresh = output<void>();
  remove = output<void>();
}
```

```html
<div [class.no-button]="!showRefresh() && !showRemove()">{{ code() }}</div>
@if (showRefresh()) {
  <button [class.no-remove]="!showRemove()" (click)="refresh.emit()" …></button>
}
```

Public selector and input/output **names stay the same** — parent templates need no changes unless you remove dead bindings or switch projection to inputs.

---

## 10. PR sizing

- Prefer **one component or a small batch of trivial siblings** per PR (e.g. `loading` + `empty-content`).
- Do not mix unrelated features with ui-component modernization.
- Document e2e/manual test notes in the PR when coverage is partial.

---

## Quick reference: mistakes to avoid

1. Projecting **dynamic strings** instead of using signal **inputs** on OnPush leaf components.
2. Setting **`OnPush` explicitly** (redundant in Angular 22).
3. Mixing **`[attr.class]` and `[class]`** on the same element.
4. Forgetting **`()`** on every signal in templates after migration.
5. Making inputs **`required`** without grepping all call sites and updating specs.
6. **Keeping legacy optional defaults** (`= ''`, `= []`, `?`) without checking call sites — they often existed because `@Input()` could not be required, not because omission is valid.
7. Leaving **dead inputs** or **ignored parent attributes** after API cleanup.
8. Assuming **e2e covers** modernized components — grep `e2e/` first.
