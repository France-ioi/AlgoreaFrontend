import { Item } from 'src/app/data-access/get-item-by-id.service';
import { isInfinite } from 'src/app/utils/date';
import {
  ItemEnteringTimeIntervalsPerm,
  ItemEntryTimePerm,
} from './item-permissions';
import { allowsViewingInfo, ItemPermWithView } from './item-view-permission';

type ItemEnteringFields = Pick<
  Item,
  'entryMinAdmittedMembersRatio' | 'entryParticipantType' | 'enteringTimeMin' | 'enteringTimeMax'
>;

export type ActivityOpeningPeriod =
  | { kind: 'closedSince', date: Date }
  | { kind: 'always' }
  | { kind: 'between', from: Date, until: Date }
  | { kind: 'from', from: Date }
  | { kind: 'until', until: Date };

/**
 * Display shape for one enter-permission interval.
 * `none` means the backend "no enter" sentinel (infinite canEnterFrom) and should not be shown.
 */
export type EnterIntervalDisplay =
  | { kind: 'none' }
  | { kind: 'always' }
  | { kind: 'from', from: Date }
  | { kind: 'fromUntil', from: Date, until: Date };

/** True when the activity requires the enter permission (ratio is not None). */
export function isEnterPermissionRequired(item: Pick<ItemEnteringFields, 'entryMinAdmittedMembersRatio'>): boolean {
  return item.entryMinAdmittedMembersRatio !== 'None';
}

/**
 * Whether the activity's own opening window currently allows entering.
 * Returns `undefined` when participant type is not User (team conditions may apply).
 */
export function doesActivityAllowEnteringNow(
  item: Pick<ItemEnteringFields, 'entryParticipantType' | 'enteringTimeMin' | 'enteringTimeMax'>,
  now: Date,
): boolean | undefined {
  if (item.entryParticipantType !== 'User') return undefined;
  return item.enteringTimeMin <= now && now < item.enteringTimeMax;
}

/** The enter-permission interval that covers `now`, if any. */
export function currentEnteringInterval(
  intervals: ItemEntryTimePerm[],
  now: Date,
): ItemEntryTimePerm | undefined {
  return intervals.find(interval => interval.canEnterFrom <= now && now < interval.canEnterUntil);
}

/**
 * Whether permissions are sufficient to enter: info view, and a current enter interval when required.
 */
export function allowsEntering(
  perms: ItemPermWithView & ItemEnteringTimeIntervalsPerm,
  item: Pick<ItemEnteringFields, 'entryMinAdmittedMembersRatio'>,
  now: Date,
): boolean {
  if (!allowsViewingInfo(perms)) return false;
  if (!isEnterPermissionRequired(item)) return true;
  return currentEnteringInterval(perms.enteringTimeIntervals, now) !== undefined;
}

/** How the activity's entering-time window relates to `now`. */
export function activityOpeningPeriod(
  item: Pick<ItemEnteringFields, 'enteringTimeMin' | 'enteringTimeMax'>,
  now: Date,
): ActivityOpeningPeriod {
  const { enteringTimeMin: min, enteringTimeMax: max } = item;
  // Align with doesActivityAllowEnteringNow (now < max): closed when max has been reached.
  if (max <= now) return { kind: 'closedSince', date: max };

  const minInPastOrNow = min <= now;
  const maxInfinite = isInfinite(max);

  if (minInPastOrNow && maxInfinite) return { kind: 'always' };
  if (!minInPastOrNow && !maxInfinite) return { kind: 'between', from: min, until: max };
  if (!minInPastOrNow && maxInfinite) return { kind: 'from', from: min };
  return { kind: 'until', until: max };
}

/**
 * Display shape for one enter-permission interval.
 * Infinite `canEnterFrom` is the backend "no enter permission" sentinel (not an open lower bound).
 * A real always-grant is a started (past/now) `from` with infinite `until`.
 */
export function enterIntervalDisplay(interval: ItemEntryTimePerm, now: Date): EnterIntervalDisplay {
  const { canEnterFrom: from, canEnterUntil: until } = interval;
  if (isInfinite(from)) return { kind: 'none' };
  if (isInfinite(until)) {
    return from <= now ? { kind: 'always' } : { kind: 'from', from };
  }
  return { kind: 'fromUntil', from, until };
}
