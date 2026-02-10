import { isUser } from 'src/app/models/routing/group-route';
import { isATask, ItemType } from 'src/app/items/models/item-type';
import { allowsWatchingAnswers, ItemPermWithWatch } from 'src/app/items/models/item-watch-permission';
import { ObservationInfo } from 'src/app/store/observation/models';

/**
 * Whether a thread can exist for the given context.
 * A thread can exist if:
 * - The item is a task (chapters and skills cannot have threads)
 * - Either not observing, or observing a user (not a group)
 */
export function canThreadExist(item: { type: ItemType }, observationInfo: ObservationInfo | null): boolean {
  if (!isATask(item)) return false;
  // Thread can exist if not observing, or if observing a user (not a group)
  return observationInfo === null || isUser(observationInfo.route);
}

/**
 * Whether the user has permissions to open a thread without needing an API call.
 * Returns true if:
 * - Not observing AND canRequestHelp is true, OR
 * - Observing a user AND allowsWatchingAnswers AND currentUserWatchGroup
 */
export function canOpenThread(
  item: { permissions: ItemPermWithWatch & { canRequestHelp: boolean } },
  observationInfo: ObservationInfo | null
): boolean {
  if (observationInfo === null) {
    // Not observing: check canRequestHelp
    return item.permissions.canRequestHelp;
  }
  if (!isUser(observationInfo.route)) {
    // Observing a group (not a user): cannot open thread
    return false;
  }
  // Observing a user: check allowsWatchingAnswers AND currentUserWatchGroup
  return allowsWatchingAnswers(item.permissions) && observationInfo.currentUserWatchGroup;
}
