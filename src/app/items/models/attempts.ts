import { userBaseSchema, withGroupId } from 'src/app/groups/models/user';
import { canCurrentUserViewContent, ItemPermWithView } from './item-view-permission';
import { z } from 'zod';
import { isPastDate } from 'src/app/utils/date';

export const attemptResultSchema = z.object({
  id: z.string(),
  allowsSubmissionsUntil: z.coerce.date(),
  createdAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
  latestActivityAt: z.coerce.date(),
  scoreComputed: z.number(),
  startedAt: z.coerce.date().nullable(),
  validated: z.boolean(),
  userCreator: withGroupId(userBaseSchema).nullable(),
});

export interface Result {
  attemptId: string,
  latestActivityAt: Date,
  startedAt: Date|null,
  endedAt: Date|null,
  score: number,
  validated: boolean,
  allowsSubmissionsUntil: Date,
}

export function resultFromFetchedResult(result: z.infer<typeof attemptResultSchema>): Result {
  return {
    attemptId: result.id,
    latestActivityAt: result.latestActivityAt,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    score: result.scoreComputed,
    validated: result.validated,
    allowsSubmissionsUntil: result.allowsSubmissionsUntil
  };
}

export const defaultAttemptId = '0'; // to be used as parent attempt for root items

export function bestAttemptFromResults<T extends { latestActivityAt: Date, startedAt: Date|null }>(results: T[]): T|null {
  if (results.length === 0) return null;

  // pick the one which is started and with the greatest latest_activity_at
  return results.reduce<T|null>((acc, current) => {
    if (current.startedAt === null) return acc;
    if (acc === null) return current;
    return acc.latestActivityAt.getTime() < current.latestActivityAt.getTime() ? current : acc;
  }, null);
}

interface Item {
  requiresExplicitEntry: boolean,
  permissions: ItemPermWithView,
}

export function implicitResultStart(item: Item): boolean {
  return canCurrentUserViewContent(item) && !item.requiresExplicitEntry;
}

export function canCreateResults(item: Item): boolean {
  return canCurrentUserViewContent(item);
}

/**
 * Whether `allowsSubmissionsUntil` is in the past. An infinite deadline is never past, so no extra guard.
 */
export function areSubmissionsClosed(result: Pick<Result, 'allowsSubmissionsUntil'>): boolean {
  return isPastDate(result.allowsSubmissionsUntil);
}
