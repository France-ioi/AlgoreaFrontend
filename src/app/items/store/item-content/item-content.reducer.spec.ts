import { reducer } from './item-content.reducer';
import { initialState } from './item-content.state';
import { itemByIdPageActions } from './item-content.actions';
import { readyState, fetchingState } from 'src/app/utils/state';
import { Result } from '../../models/attempts';
import { resultsFetchKey, itemRoute } from 'src/app/models/routing/item-route';

describe('item-content reducer attemptStarted', () => {
  const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0' });
  const key = resultsFetchKey(route);
  const result: Result = {
    attemptId: '42',
    latestActivityAt: new Date(),
    startedAt: new Date(),
    endedAt: null,
    score: 0,
    validated: false,
    allowsSubmissionsUntil: new Date(),
  };

  it('appends the result to a ready list', () => {
    const state = {
      ...initialState,
      resultsState: readyState<Result[], typeof key>([], key),
    };
    const next = reducer(state, itemByIdPageActions.attemptStarted({ result }));
    expect(next.resultsState.data).toEqual([ result ]);
  });

  it('does not duplicate an existing attemptId', () => {
    const state = {
      ...initialState,
      resultsState: readyState([ result ], key),
    };
    const next = reducer(state, itemByIdPageActions.attemptStarted({ result: { ...result, score: 99 } }));
    expect(next.resultsState.data).toEqual([ result ]);
  });

  it('no-ops while results are still fetching (no data to append to)', () => {
    const state = {
      ...initialState,
      resultsState: fetchingState<Result[], typeof key>(undefined, key),
    };
    const next = reducer(state, itemByIdPageActions.attemptStarted({ result }));
    expect(next.resultsState.isFetching).toBeTrue();
    expect(next.resultsState.data).toBeUndefined();
  });
});
