import { backendInfiniteDateString } from 'src/app/utils/date';
import { ItemViewPerm } from './item-view-permission';
import {
  activityOpeningPeriod,
  allowsEntering,
  currentEnteringInterval,
  doesActivityAllowEnteringNow,
  enterIntervalDisplay,
  isEnterPermissionRequired,
} from './item-entering';
import { ItemEntryTimePerm } from './item-permissions';

const now = new Date('2024-06-15T12:00:00Z');
const past = new Date('2024-01-01T00:00:00Z');
const future = new Date('2024-12-01T00:00:00Z');
const farFuture = new Date(backendInfiniteDateString);
const farPast = new Date('1000-01-01T00:00:00Z');

function perms(overrides: {
  canView?: ItemViewPerm,
  enteringTimeIntervals?: ItemEntryTimePerm[],
} = {}): { canView: ItemViewPerm, enteringTimeIntervals: ItemEntryTimePerm[] } {
  return {
    canView: overrides.canView ?? ItemViewPerm.Info,
    enteringTimeIntervals: overrides.enteringTimeIntervals ?? [],
  };
}

describe('isEnterPermissionRequired', () => {
  it('is false when ratio is None', () => {
    expect(isEnterPermissionRequired({ entryMinAdmittedMembersRatio: 'None' })).toBe(false);
  });

  it('is true for One, Half and All', () => {
    expect(isEnterPermissionRequired({ entryMinAdmittedMembersRatio: 'One' })).toBe(true);
    expect(isEnterPermissionRequired({ entryMinAdmittedMembersRatio: 'Half' })).toBe(true);
    expect(isEnterPermissionRequired({ entryMinAdmittedMembersRatio: 'All' })).toBe(true);
  });
});

describe('doesActivityAllowEnteringNow', () => {
  const openWindow = { enteringTimeMin: past, enteringTimeMax: future };

  it('returns undefined when participant type is Team', () => {
    expect(doesActivityAllowEnteringNow({ ...openWindow, entryParticipantType: 'Team' }, now)).toBeUndefined();
  });

  it('returns true when now is inside the window for User', () => {
    expect(doesActivityAllowEnteringNow({ ...openWindow, entryParticipantType: 'User' }, now)).toBe(true);
  });

  it('returns false when now is before the window', () => {
    expect(doesActivityAllowEnteringNow({
      entryParticipantType: 'User',
      enteringTimeMin: future,
      enteringTimeMax: farFuture,
    }, now)).toBe(false);
  });

  it('returns false when now is at or after enteringTimeMax', () => {
    expect(doesActivityAllowEnteringNow({
      entryParticipantType: 'User',
      enteringTimeMin: past,
      enteringTimeMax: now,
    }, now)).toBe(false);
  });

  it('returns true when now equals enteringTimeMin', () => {
    expect(doesActivityAllowEnteringNow({
      entryParticipantType: 'User',
      enteringTimeMin: now,
      enteringTimeMax: future,
    }, now)).toBe(true);
  });
});

describe('currentEnteringInterval', () => {
  const pastInterval: ItemEntryTimePerm = { canEnterFrom: farPast, canEnterUntil: past };
  const currentInterval: ItemEntryTimePerm = { canEnterFrom: past, canEnterUntil: future };
  const futureInterval: ItemEntryTimePerm = { canEnterFrom: future, canEnterUntil: farFuture };

  it('returns undefined when no interval covers now', () => {
    expect(currentEnteringInterval([ pastInterval, futureInterval ], now)).toBeUndefined();
  });

  it('returns the interval that covers now', () => {
    expect(currentEnteringInterval([ pastInterval, currentInterval, futureInterval ], now)).toBe(currentInterval);
  });

  it('excludes an interval that ends exactly at now', () => {
    expect(currentEnteringInterval([ { canEnterFrom: past, canEnterUntil: now } ], now)).toBeUndefined();
  });
});

describe('allowsEntering', () => {
  it('requires info view', () => {
    expect(allowsEntering(
      perms({ canView: ItemViewPerm.None }),
      { entryMinAdmittedMembersRatio: 'None' },
      now,
    )).toBe(false);
  });

  it('allows entering with info view when enter permission is not required', () => {
    expect(allowsEntering(
      perms({ canView: ItemViewPerm.Info }),
      { entryMinAdmittedMembersRatio: 'None' },
      now,
    )).toBe(true);
  });

  it('requires a current interval when enter permission is required', () => {
    expect(allowsEntering(
      perms({ enteringTimeIntervals: [] }),
      { entryMinAdmittedMembersRatio: 'One' },
      now,
    )).toBe(false);

    expect(allowsEntering(
      perms({ enteringTimeIntervals: [ { canEnterFrom: past, canEnterUntil: future } ] }),
      { entryMinAdmittedMembersRatio: 'Half' },
      now,
    )).toBe(true);
  });
});

describe('activityOpeningPeriod', () => {  it('returns closedSince when enteringTimeMax is in the past', () => {
    expect(activityOpeningPeriod({ enteringTimeMin: farPast, enteringTimeMax: past }, now)).toEqual({
      kind: 'closedSince',
      date: past,
    });
  });

  it('returns always when min is in the past and max is infinite', () => {
    expect(activityOpeningPeriod({ enteringTimeMin: past, enteringTimeMax: farFuture }, now)).toEqual({
      kind: 'always',
    });
  });

  it('returns between when min is in the future and max is finite', () => {
    expect(activityOpeningPeriod({ enteringTimeMin: future, enteringTimeMax: new Date('2025-01-01T00:00:00Z') }, now)).toEqual({
      kind: 'between',
      from: future,
      until: new Date('2025-01-01T00:00:00Z'),
    });
  });

  it('returns from when min is in the future and max is infinite', () => {
    expect(activityOpeningPeriod({ enteringTimeMin: future, enteringTimeMax: farFuture }, now)).toEqual({
      kind: 'from',
      from: future,
    });
  });

  it('returns until when min is in the past and max is finite', () => {
    expect(activityOpeningPeriod({ enteringTimeMin: past, enteringTimeMax: future }, now)).toEqual({
      kind: 'until',
      until: future,
    });
  });

  it('returns closedSince when enteringTimeMax equals now', () => {
    expect(activityOpeningPeriod({ enteringTimeMin: past, enteringTimeMax: now }, now)).toEqual({
      kind: 'closedSince',
      date: now,
    });
  });
});

describe('enterIntervalDisplay', () => {
  it('returns none when both bounds are infinite (no-enter sentinel)', () => {
    expect(enterIntervalDisplay({ canEnterFrom: farFuture, canEnterUntil: farFuture }, now)).toEqual({ kind: 'none' });
  });

  it('returns none when only from is infinite', () => {
    expect(enterIntervalDisplay({ canEnterFrom: farFuture, canEnterUntil: future }, now)).toEqual({ kind: 'none' });
  });

  it('returns always when from is in the past and until is infinite', () => {
    expect(enterIntervalDisplay({ canEnterFrom: past, canEnterUntil: farFuture }, now)).toEqual({ kind: 'always' });
  });

  it('returns from when from is in the future and until is infinite', () => {
    expect(enterIntervalDisplay({ canEnterFrom: future, canEnterUntil: farFuture }, now)).toEqual({
      kind: 'from',
      from: future,
    });
  });

  it('returns fromUntil when both bounds are finite', () => {
    expect(enterIntervalDisplay({ canEnterFrom: past, canEnterUntil: future }, now)).toEqual({
      kind: 'fromUntil',
      from: past,
      until: future,
    });
  });
});
