import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { RootState } from 'src/app/utils/store/root_state';
import { BackLink, State } from './back-link.state';

interface BackLinkSelectors<T> {
  selectBackLink: MemoizedSelector<T, BackLink | null>,
}

export const getBackLinkSelectors = <T extends RootState>(
  selectBackLinkState: Selector<T, State>
): BackLinkSelectors<T> => {
  const selectBackLink = createSelector(
    selectBackLinkState,
    state => state.backLink,
  );

  return { selectBackLink };
};
