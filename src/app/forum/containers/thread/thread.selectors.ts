import { createSelector } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { fromItemContent } from 'src/app/items/store';
import { fromGroupContent } from 'src/app/groups/store';

export const selectThreadAssignmentIndex = createSelector(
  fromForum.selectInfo,
  info => {
    if (!info.data) return 0;
    return info.data.status === 'waiting_for_participant' ? 0 : 1;
  }
);

export const selectThreadRawStatus = createSelector(
  fromForum.selectInfo,
  info => info.data?.status ?? null,
);

export function truncateLabel(text: string, maxLength: number): string {
  return text.length > maxLength ? `${ text.slice(0, maxLength) }…` : text;
}

export const selectThreadInfo = createSelector(
  fromItemContent.selectActiveContentItem,
  fromGroupContent.selectObservationInfoForFetchedContent,
  fromForum.selectThreadStatus,
  (item, observationInfo, threadStatus) => ({
    threadStatus,
    itemInfo: threadStatus?.id.itemId === item?.id ? item : null,
    groupInfo: observationInfo && threadStatus?.id.participantId === observationInfo.data?.route.id ? observationInfo.data : null,
  })
);
