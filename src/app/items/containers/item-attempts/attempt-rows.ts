import { areSubmissionsClosed, Result } from '../../models/attempts';
import { isInfinite } from 'src/app/utils/date';

export interface AttemptRow {
  result: Result,
  number: number,
  isCurrent: boolean,
  isReadOnly: boolean,
  /** False for created-but-never-entered attempts — Select would load content without going through Enter. */
  canSelect: boolean,
  submissionsUntil: Date|null,
}

/**
 * Build table rows ordered by startedAt ascending (nulls last), numbered from 1.
 * `submissionsUntil` is null when the deadline is past or infinite (nothing useful to show).
 */
export function buildAttemptRows(results: Result[], currentAttemptId: string|undefined): AttemptRow[] {
  const ordered = [ ...results ].sort((a, b) => {
    if (a.startedAt === null && b.startedAt === null) return 0;
    if (a.startedAt === null) return 1;
    if (b.startedAt === null) return -1;
    return a.startedAt.getTime() - b.startedAt.getTime();
  });

  return ordered.map((result, index) => {
    const isReadOnly = areSubmissionsClosed(result);
    const submissionsUntil = isReadOnly || isInfinite(result.allowsSubmissionsUntil)
      ? null
      : result.allowsSubmissionsUntil;
    return {
      result,
      number: index + 1,
      isCurrent: result.attemptId === currentAttemptId,
      isReadOnly,
      canSelect: result.startedAt !== null,
      submissionsUntil,
    };
  });
}
