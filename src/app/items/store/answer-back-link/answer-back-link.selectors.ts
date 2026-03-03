import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { RootState } from 'src/app/utils/store/root_state';
import { AnswerBackLink, State } from './answer-back-link.state';

interface AnswerBackLinkSelectors<T> {
  selectAnswerBackLink: MemoizedSelector<T, AnswerBackLink | null>,
}

// eslint-disable-next-line @ngrx/prefix-selectors-with-select
export const getAnswerBackLinkSelectors = <T extends RootState>(
  selectAnswerBackLinkState: Selector<T, State>
): AnswerBackLinkSelectors<T> => {
  const selectAnswerBackLink = createSelector(
    selectAnswerBackLinkState,
    state => state.backLink,
  );

  return { selectAnswerBackLink };
};
