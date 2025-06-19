import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { FetchState } from 'src/app/utils/state';

export interface ObservationInfo {
  route: RawGroupRoute,
  name: string,
  currentUserCanGrantAccess: boolean,
}

export const routerActions = createActionGroup({
  source: 'Router',
  events: {
    disableObservation: emptyProps(),
    enableObservation: props<{ route: RawGroupRoute }>(),
  },
});

export interface FetchedObservedGroupInfo { name: string, currentUserCanGrantAccess: boolean }

export const groupInfoFetchedActions = createActionGroup({
  source: 'Group API',
  events: {
    fetchStateChanged: props<{ route: RawGroupRoute, fetchState: FetchState<FetchedObservedGroupInfo> }>(),
  }
});
