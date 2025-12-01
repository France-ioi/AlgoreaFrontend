import { createSelector } from '@ngrx/store';
import { fromItemContent } from '../store';
import { fromObservation } from 'src/app/store/observation';

const selectActiveItemCurrentUserScore = createSelector(
  fromItemContent.selectActiveContentItem,
  fromItemContent.selectActiveContentResults,
  (item, resultData) => (!item || item.noScore || !resultData || resultData.results.length === 0 ? null : {
    best: item.bestScore,
    current: resultData.currentResult?.score ?? null,
    validated: !!(resultData.currentResult?.validated)
  })
);

const selectActiveItemObservedGroupScore = createSelector(
  fromItemContent.selectActiveContentItem,
  item => (!item || item.noScore || item.watchedGroup?.averageScore === undefined ? null : {
    best: item.watchedGroup.averageScore,
    current: item.watchedGroup.averageScore,
    validated: item.watchedGroup.averageScore === 100,
  })
);

export const selectActiveItemDisplayedScore = createSelector(
  fromObservation.selectIsObserving,
  selectActiveItemCurrentUserScore,
  selectActiveItemObservedGroupScore,
  (isObserving, currentUserScore, observedGroupScore) => (isObserving ? observedGroupScore : currentUserScore)
);
