import { createReducer, on } from '@ngrx/store';
import { State, initialState } from './item-content.state';
import { itemByIdPageActions, itemFetchingActions, itemRouteErrorHandlingActions } from './item-content.actions';
import { mapStateData } from 'src/app/utils/state';
import { patchItemScore, patchResultScore } from '../../models/score-patching';

export const reducer = createReducer(
  initialState,

  on(
    itemRouteErrorHandlingActions.routeErrorHandlingChange,
    (state, { newState }): State => ({ ...state, routeErrorHandling: newState })
  ),

  on(
    itemFetchingActions.itemFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, itemState: fetchState })
  ),

  on(
    itemFetchingActions.breadcrumbsFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, breadcrumbsState: fetchState })
  ),

  on(
    itemFetchingActions.resultsFetchStateChanged,
    (state, { fetchState }): State => ({ ...state, resultsState: fetchState })
  ),

  on(itemByIdPageActions.patchScore,
    (state, { score }): State => ({
      ...state,
      itemState: mapStateData(state.itemState, i => patchItemScore(i, score)),
      resultsState: mapStateData(state.resultsState, r => patchResultScore(r, score)),
    })

  )

);
