import { Item } from 'src/app/data-access/get-item-by-id.service';
import { Duration } from 'src/app/utils/duration';
import { ItemChanges } from '../data-access/update-item.service';
import { buildDisplaySettingsBody } from './display-settings';
import { ItemType } from './item-type';
import { z } from 'zod';
import { itemChildrenLayoutSchema, itemEntryMinAdmittedMembersRatioSchema, itemValidationTypeSchema } from './item-properties';

/**
 * Sentinel values agreed with the backend: "no constraint" on the entering-time interval is
 * encoded as these out-of-range timestamps. Centralized here so the form and the diff agree.
 */
export const DEFAULT_ENTERING_TIME_MIN = '1000-01-01T00:00:00Z';
export const DEFAULT_ENTERING_TIME_MAX = '9999-12-31T23:59:59Z';

export type ItemValidationType = z.infer<typeof itemValidationTypeSchema>;
export type ItemChildrenLayout = z.infer<typeof itemChildrenLayoutSchema>;
export type ItemEntryMinAdmittedMembersRatio = z.infer<typeof itemEntryMinAdmittedMembersRatioSchema>;

export interface ItemParametersGlobalValue {
  url: string,
  usesApi: boolean,
  textId: string,
}

export interface ItemParametersScoreValue {
  validationType: ItemValidationType,
  noScore: boolean,
}

export interface ItemParametersDisplayValue {
  promptToJoinGroupByCode: boolean,
  childrenLayout: ItemChildrenLayout,
}

export interface ItemParametersParticipationValue {
  allowsMultipleAttempts: boolean,
  requiresExplicitEntry: boolean,
  durationEnabled: boolean,
  duration: Duration | null,
  enteringTimeMinEnabled: boolean,
  enteringTimeMin: Date | null,
  enteringTimeMaxEnabled: boolean,
  enteringTimeMax: Date | null,
}

export interface ItemParametersTeamValue {
  entryParticipantTypeIsTeam: boolean,
  entryFrozenTeams: boolean,
  entryMaxTeamSize: number,
  entryMinAdmittedMembersRatio: ItemEntryMinAdmittedMembersRatio,
}

/** Flat camelCase value exposed by `alg-item-parameters-form`; what the wrapper consumes. */
export type ItemParametersValue = ItemParametersGlobalValue
  & ItemParametersScoreValue
  & ItemParametersDisplayValue
  & ItemParametersParticipationValue
  & ItemParametersTeamValue;

/**
 * Compile-time guarantee that the five slice types have disjoint key sets, so the form
 * component's `flatten()` spread is unambiguous. Adding a field that already exists in another
 * slice will turn the corresponding tuple slot from `true` to `never`, breaking the assignment.
 * The tuple shape (rather than an intersection) sidesteps `no-duplicate-type-constituents`.
 */
type Disjoint<A, B> = keyof A & keyof B extends never ? true : never;
export const sliceKeysAreDisjoint: [
  Disjoint<ItemParametersGlobalValue, ItemParametersScoreValue>,
  Disjoint<ItemParametersGlobalValue, ItemParametersDisplayValue>,
  Disjoint<ItemParametersGlobalValue, ItemParametersParticipationValue>,
  Disjoint<ItemParametersGlobalValue, ItemParametersTeamValue>,
  Disjoint<ItemParametersScoreValue, ItemParametersDisplayValue>,
  Disjoint<ItemParametersScoreValue, ItemParametersParticipationValue>,
  Disjoint<ItemParametersScoreValue, ItemParametersTeamValue>,
  Disjoint<ItemParametersDisplayValue, ItemParametersParticipationValue>,
  Disjoint<ItemParametersDisplayValue, ItemParametersTeamValue>,
  Disjoint<ItemParametersParticipationValue, ItemParametersTeamValue>,
] = [ true, true, true, true, true, true, true, true, true, true ];

/**
 * Single source of truth for "what does this item type's parameters form look like": drives
 * both `@if`-rendering in the form template and the diff in `buildItemParametersChanges`.
 *
 * `display` is a nested object because the section has sub-options (`childrenLayout`,
 * `imageUrl`) whose visibility depends on the item type too — keeping them grouped here lets
 * the template read `secs.display.*` instead of duplicating the item-type literals inline.
 */
export interface ItemParametersSections {
  global: boolean,
  score: boolean,
  display: {
    enabled: boolean,
    showChildrenLayout: boolean,
    showImageUrl: boolean,
  },
  participation: boolean,
  team: boolean,
}

export function sectionsForItemType(type: ItemType): ItemParametersSections {
  return {
    global: type === 'Task',
    score: type === 'Chapter' || type === 'Skill',
    display: {
      enabled: type !== 'Skill',
      showChildrenLayout: type !== 'Task',
      showImageUrl: type === 'Task' || type === 'Chapter',
    },
    participation: type !== 'Skill',
    team: type !== 'Skill',
  };
}

/**
 * Trim a free-form string field and collapse empty/whitespace-only input to `null`, matching
 * the backend convention for nullable string columns (`url`, `text_id`). Applying this to both
 * sides of the diff means a save that only added/removed whitespace is correctly a no-op.
 */
function trimToNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed !== '' ? trimmed : null;
}

/** Whether the saved `enteringTimeMin` is the "no constraint" sentinel. */
function isDefaultEnteringTimeMin(date: Date): boolean {
  return date.getTime() === new Date(DEFAULT_ENTERING_TIME_MIN).getTime();
}

function isDefaultEnteringTimeMax(date: Date): boolean {
  return date.getTime() === new Date(DEFAULT_ENTERING_TIME_MAX).getTime();
}

export function itemToParametersValue(item: Item): ItemParametersValue {
  return {
    url: item.url || '',
    usesApi: item.usesApi || false,
    textId: item.textId || '',
    validationType: item.validationType,
    noScore: item.noScore,
    promptToJoinGroupByCode: item.displaySettings.promptToJoinGroupByCode,
    childrenLayout: item.displaySettings.childrenLayout,
    allowsMultipleAttempts: item.allowsMultipleAttempts,
    requiresExplicitEntry: item.requiresExplicitEntry,
    durationEnabled: item.duration !== null,
    duration: item.duration,
    enteringTimeMinEnabled: !isDefaultEnteringTimeMin(item.enteringTimeMin),
    enteringTimeMin: item.enteringTimeMin,
    enteringTimeMaxEnabled: !isDefaultEnteringTimeMax(item.enteringTimeMax),
    enteringTimeMax: item.enteringTimeMax,
    entryParticipantTypeIsTeam: item.entryParticipantType === 'Team',
    entryFrozenTeams: item.entryFrozenTeams,
    entryMaxTeamSize: item.entryMaxTeamSize,
    entryMinAdmittedMembersRatio: item.entryMinAdmittedMembersRatio,
  };
}

/**
 * Build the snake_case `ItemChanges` payload from the current/initial form values.
 *
 * Mirrors backend semantics:
 * - `url` and `text_id`: empty string → null
 * - `duration`: serialized only when the participation section is enabled; sent as null when
 *   either `durationEnabled` or `requiresExplicitEntry` is false (so a disabled duration field
 *   clears the saved value)
 * - `entering_time_min/max`: when the per-bound toggle is off, the sentinel "no constraint"
 *   timestamps are sent instead of omitting the key
 * - `display_settings`: emitted only when at least one display-settings input changed, then
 *   built via `buildDisplaySettingsBody` so backend defaults are not echoed back
 *
 * `sections` lets callers skip slices that don't apply to the current item type (e.g. Skill
 * has neither participation nor team).
 */
export function buildItemParametersChanges(
  current: ItemParametersValue,
  initial: ItemParametersValue,
  sections: ItemParametersSections,
  initialDisplaySettings: { childrenLayout: ItemChildrenLayout, promptToJoinGroupByCode: boolean },
): ItemChanges {
  const changes: ItemChanges = {};

  if (sections.global) {
    const url = trimToNullable(current.url);
    const initialUrl = trimToNullable(initial.url);
    if (url !== initialUrl) changes.url = url;

    if (current.usesApi !== initial.usesApi) changes.uses_api = current.usesApi;

    const textId = trimToNullable(current.textId);
    const initialTextId = trimToNullable(initial.textId);
    if (textId !== initialTextId) changes.text_id = textId;
  }

  if (sections.score) {
    if (current.validationType !== initial.validationType) changes.validation_type = current.validationType;
    if (current.noScore !== initial.noScore) changes.no_score = current.noScore;
  }

  if (sections.display.enabled) {
    const hasDisplaySettingsChanges = current.promptToJoinGroupByCode !== initial.promptToJoinGroupByCode
      || current.childrenLayout !== initial.childrenLayout;
    if (hasDisplaySettingsChanges) {
      changes.display_settings = buildDisplaySettingsBody({
        ...initialDisplaySettings,
        childrenLayout: current.childrenLayout,
        promptToJoinGroupByCode: current.promptToJoinGroupByCode,
      });
    }
  }

  if (sections.participation) {
    Object.assign(changes, buildParticipationChanges(current, initial));
  }

  if (sections.team) {
    Object.assign(changes, buildTeamChanges(current, initial));
  }

  return changes;
}

function buildParticipationChanges(
  current: ItemParametersParticipationValue,
  initial: ItemParametersParticipationValue,
): ItemChanges {
  const changes: ItemChanges = {};

  if (current.allowsMultipleAttempts !== initial.allowsMultipleAttempts) {
    changes.allows_multiple_attempts = current.allowsMultipleAttempts;
  }

  const hasRequiresExplicitEntryChanges = current.requiresExplicitEntry !== initial.requiresExplicitEntry;
  if (hasRequiresExplicitEntryChanges) {
    changes.requires_explicit_entry = current.requiresExplicitEntry;
  }

  const hasDurationEnabledChanges = current.durationEnabled !== initial.durationEnabled;
  const hasDurationChanges = current.duration?.getMs() !== initial.duration?.getMs();
  if (hasDurationChanges || hasDurationEnabledChanges || hasRequiresExplicitEntryChanges) {
    changes.duration = current.durationEnabled && current.requiresExplicitEntry
      ? current.duration?.toString()
      : null;
  }

  const hasEnteringTimeMinEnabledChanges = current.enteringTimeMinEnabled !== initial.enteringTimeMinEnabled;
  const hasEnteringTimeMinChanges = current.enteringTimeMin
    && current.enteringTimeMin.getTime() !== initial.enteringTimeMin?.getTime();
  if (hasEnteringTimeMinChanges || hasEnteringTimeMinEnabledChanges) {
    changes.entering_time_min = current.enteringTimeMinEnabled && current.enteringTimeMin
      ? current.enteringTimeMin
      : new Date(DEFAULT_ENTERING_TIME_MIN);
  }

  const hasEnteringTimeMaxEnabledChanges = current.enteringTimeMaxEnabled !== initial.enteringTimeMaxEnabled;
  const hasEnteringTimeMaxChanges = current.enteringTimeMax
    && current.enteringTimeMax.getTime() !== initial.enteringTimeMax?.getTime();
  if (hasEnteringTimeMaxChanges || hasEnteringTimeMaxEnabledChanges) {
    changes.entering_time_max = current.enteringTimeMaxEnabled && current.enteringTimeMax
      ? current.enteringTimeMax
      : new Date(DEFAULT_ENTERING_TIME_MAX);
  }

  return changes;
}

function buildTeamChanges(current: ItemParametersTeamValue, initial: ItemParametersTeamValue): ItemChanges {
  const changes: ItemChanges = {};

  if (current.entryParticipantTypeIsTeam !== initial.entryParticipantTypeIsTeam) {
    changes.entry_participant_type = current.entryParticipantTypeIsTeam ? 'Team' : 'User';
  }

  if (current.entryFrozenTeams !== initial.entryFrozenTeams) {
    changes.entry_frozen_teams = current.entryFrozenTeams;
  }

  if (current.entryMaxTeamSize !== initial.entryMaxTeamSize) {
    changes.entry_max_team_size = current.entryMaxTeamSize;
  }

  if (current.entryMinAdmittedMembersRatio !== initial.entryMinAdmittedMembersRatio) {
    changes.entry_min_admitted_members_ratio = current.entryMinAdmittedMembersRatio;
  }

  return changes;
}
