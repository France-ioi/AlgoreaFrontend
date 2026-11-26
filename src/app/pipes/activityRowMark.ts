import { ActivityLogs } from 'src/app/data-access/activity-log.service';

export type ActivityRowMark =
  | { kind: 'score' }
  | { kind: 'icon', iconClass: string };

const storedAnswerIcon = 'ph-duotone ph-floppy-disk-back';

/**
 * Which mark a history row shows.
 * A saved or current answer keeps the floppy even when a score is present.
 * Any other row with a score, including 0, shows the score ring.
 */
export function activityRowMark(
  activityType: ActivityLogs[number]['activityType'],
  score: number | undefined,
): ActivityRowMark {
  if (activityType === 'saved_answer' || activityType === 'current_answer') {
    return { kind: 'icon', iconClass: storedAnswerIcon };
  }
  if (score !== undefined) return { kind: 'score' };
  switch (activityType) {
    case 'result_started': return { kind: 'icon', iconClass: 'ph-duotone ph-flag-checkered' };
    case 'result_validated': return { kind: 'icon', iconClass: 'ph ph-check-circle alg-font-size-38' };
    default: return { kind: 'icon', iconClass: '' };
  }
}
