import { backendInfiniteDateString } from 'src/app/utils/date';
import { Result } from '../../models/attempts';
import { buildAttemptRows } from './attempt-rows';

function result(partial: Partial<Result> & Pick<Result, 'attemptId'>): Result {
  return {
    latestActivityAt: new Date('2020-01-01'),
    startedAt: new Date('2020-01-01'),
    endedAt: null,
    score: 0,
    validated: false,
    allowsSubmissionsUntil: new Date('2090-01-01'),
    ...partial,
  };
}

describe('buildAttemptRows', () => {
  it('orders by startedAt ascending and numbers from 1', () => {
    const rows = buildAttemptRows([
      result({ attemptId: 'b', startedAt: new Date('2020-02-01') }),
      result({ attemptId: 'a', startedAt: new Date('2020-01-01') }),
      result({ attemptId: 'c', startedAt: new Date('2020-03-01') }),
    ], 'b');

    expect(rows.map(r => r.result.attemptId)).toEqual([ 'a', 'b', 'c' ]);
    expect(rows.map(r => r.number)).toEqual([ 1, 2, 3 ]);
    expect(rows[1]?.isCurrent).toBeTrue();
    expect(rows[0]?.isCurrent).toBeFalse();
  });

  it('puts null startedAt last and marks them not selectable', () => {
    const rows = buildAttemptRows([
      result({ attemptId: 'nullish', startedAt: null }),
      result({ attemptId: 'early', startedAt: new Date('2020-01-01') }),
    ], undefined);

    expect(rows.map(r => r.result.attemptId)).toEqual([ 'early', 'nullish' ]);
    expect(rows[0]?.canSelect).toBeTrue();
    expect(rows[1]?.canSelect).toBeFalse();
  });

  it('marks past allowsSubmissionsUntil as read-only and hides submissionsUntil', () => {
    const rows = buildAttemptRows([
      result({
        attemptId: 'past',
        allowsSubmissionsUntil: new Date('2000-01-01'),
      }),
    ], undefined);

    expect(rows[0]?.isReadOnly).toBeTrue();
    expect(rows[0]?.submissionsUntil).toBeNull();
  });

  it('hides infinite allowsSubmissionsUntil but does not mark as read-only', () => {
    const rows = buildAttemptRows([
      result({
        attemptId: 'forever',
        allowsSubmissionsUntil: new Date(backendInfiniteDateString),
      }),
    ], undefined);

    expect(rows[0]?.isReadOnly).toBeFalse();
    expect(rows[0]?.submissionsUntil).toBeNull();
  });

  it('exposes finite future allowsSubmissionsUntil', () => {
    const until = new Date('2090-06-01');
    const rows = buildAttemptRows([
      result({ attemptId: 'open', allowsSubmissionsUntil: until }),
    ], undefined);

    expect(rows[0]?.isReadOnly).toBeFalse();
    expect(rows[0]?.submissionsUntil).toEqual(until);
  });
});
