import { createSelector, MemoizedSelector } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { ThreadId } from '../models/threads';

/**
 * Whether the visible thread matches the current content and should be displayed inline
 * rather than in the global right panel.
 * Inline when: thread is visible, its itemId matches the active content,
 * and its participantId matches the observation context (observed group when observing,
 * current user when not observing).
 * Since the user's groupId is not in the store, consumers must provide it separately.
 */
export function createSelectThreadInlineContext(
  selectVisibleThreadId: MemoizedSelector<object, ThreadId | null>,
): MemoizedSelector<object, { threadParticipantId: string, observedGroupId: string | null } | null> {
  return createSelector(
    selectVisibleThreadId,
    fromItemContent.selectActiveContentId,
    fromObservation.selectObservedGroupId,
    (threadId, contentItemId, observedGroupId) => {
      if (!threadId || !contentItemId) return null;
      if (threadId.itemId !== contentItemId) return null;
      return { threadParticipantId: threadId.participantId, observedGroupId };
    }
  );
}

/**
 * Resolve the inline context into a boolean, given the current user's group id.
 */
export function isThreadInline(
  context: { threadParticipantId: string, observedGroupId: string | null } | null,
  userGroupId: string | undefined,
): boolean {
  if (!context) return false;
  const expectedParticipantId = context.observedGroupId ?? userGroupId;
  return context.threadParticipantId === expectedParticipantId;
}
