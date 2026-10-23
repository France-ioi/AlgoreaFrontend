# Item parameters form (editor "Parameters" tab)

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing the item editor Parameters tab, display settings, or strings save ordering.

The editor's Parameters tab is a wrapper + a self-contained typed CVA form, with the per-section parameters domain extracted to a dedicated model.

```
alg-item-edit-wrapper                  (orchestrator: itemForm + save/cancel)
└── alg-item-all-strings-form          (CVA: per-language strings, see strings folder)
└── alg-item-parameters-form           (CVA + Validator: aggregates parameter sections)
    ├── alg-item-parameters-global         (presentational: url / uses_api / text_id)
    ├── alg-item-parameters-score          (presentational: validation_type / no_score)
    ├── alg-item-parameters-display        (presentational: prompt_to_join_group_by_code / children_layout / thumbnail_url)
    ├── alg-item-parameters-participation  (CVA + Validator: explicit entry / duration / entering-time min-max)
    └── alg-item-parameters-team           (CVA + Validator: team participant type / frozen teams / max team size)
```

- **Domain model** (`src/app/items/models/item-parameters.ts`): `ItemParametersValue` is the flat camelCase value the wrapper consumes. `sectionsForItemType()` decides which sections an item type renders (and `buildItemParametersChanges()` diffs accordingly). The "no constraint" sentinels for `entering_time_min/max` (`1000-01-01` / `9999-12-31`) and the `display_settings` body shaping live here so the form and the diff agree.
- **Thumbnail URL** (`display_settings.thumbnail_url`): edited in the Display section of `alg-item-parameters-form` and saved via `PUT /items/{id}` (`buildItemParametersChanges()` → `buildDisplaySettingsBody()`). Read in the children grid from each child's `display_settings` on `GET /items/{id}/children`.
- **Children layout** (`display_settings.children_layout`): `List` | `Grid` | `Hide` | `TwoLevels`. `TwoLevels` asks `GET /items/{id}/children` with presence flags `show_level2_children=1` and `include_description=1`, then renders L1 Chapters/Skills as an `h2` (plus optional HTML description) and a compact grand-children card grid; consecutive L1 Tasks use the full-size grid (`alg-chapter-children-grid`, shared with `Grid`).
- **Strings changes** (`src/app/items/models/item-strings-changes.ts`): per-language string diff for title/subtitle/description only. Thumbnails are not written to `items_strings.image_url` from the parameters editor (`display_settings.thumbnail_url` only).
- **CVA boundary**: `alg-item-parameters-form` flattens its inner `{ global, score, display, participation, team }` group into `ItemParametersValue` on `valueChanges` and unflattens on `writeValue`, so the wrapper sees a single flat control. Each leaf CVA (`participation`, `team`) returns `null` from `validate()` when its inner form is disabled, since Angular reports `valid === false` for `DISABLED` controls and would otherwise wedge the wrapper's `itemForm.invalid` check on every save.
- **Change detection**: the three stateless section components (`global`, `score`, `display`) declare `OnPush`. The parent form (`alg-item-parameters-form`) and the two CVA sections (`participation`, `team`) keep Default CD; only the participation section needs it — `alg-input-date`'s mask binding uses a synchronous `writeValue`, which lands outside any input/event that would re-mark an `OnPush` ancestor, so the initial value would never paint into the input. Default CD on the others avoids scattering `markForCheck()` calls across the tree.

## Save ordering

`ItemEditWrapperComponent.save()` splits requests into three sequential phases driven by the item ↔ item-strings dependency on the backend (`default_language_tag` must point at an existing `items_strings` row):

1. **Creates** — `PUT /items/{id}/strings/{tag}` for languages added in this edit session.
2. **Item update** — `PUT /items/{id}` (which may carry the new `default_language_tag`).
3. **Updates + deletes (parallel)** — `PUT /items/{id}/strings/{tag}` for existing translations that changed, and `DELETE /items/{id}/strings/{tag}` for languages removed from the form. Running deletes after the item update lets the user demote-then-delete the previous default language in a single save.

`ItemAllStringsFormComponent.validate()` deliberately reads `this.form.controls.allStrings.invalid` (the inner `FormArray`) rather than `this.form.invalid` (the wrapping `FormGroup`): the wrapper's CVA validator runs from inside the array's `valueChanges`, before the parent group's `updateValueAndValidity()` has propagated, so the group status reports the pre-change value. The validator additionally polls the live `ItemStringsControl` children to cover the brief window between adding a translation and `scheduleRevalidation()` firing its registered validator.

## Strings UI states

`ItemAllStringsFormComponent` + `ItemStringsTabsComponent`: mono-platform shows fields only; a monolingual item on a multilingual platform shows fields plus a “Translate header” CTA; multilingual items (or after the CTA) use a tabbed editor with lazy-loaded non-default languages (`ItemStringsLanguageLoader` + `GetItemByIdService`, `initialLanguageValues` in the wrapper grows append-only via `languageValueLoaded`). The strings CVA value is `AllStringsFormValue` (`{ strings, pendingDeletions }`): outbound `strings` exclude pending-deletion tabs; `pendingDeletions` drives server-side deletes in `buildStringsSaveRequests()`. The tablist exposes keyboard navigation (Arrow/Home/End); trash and “+ add XX” controls sit outside the tablist for correct ARIA structure.
