import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { FetchState } from 'src/app/utils/state';

export interface ObservationInfo {
  route: RawGroupRoute,
  name: string,
  currentUserCanGrantAccess: boolean,
}

export const observationBarActions = createActionGroup({
  source: 'Observation bar',
  events: {
    disableObservation: emptyProps(),
  },
});

export const errorModalActions = createActionGroup({
  source: 'Observation Error Modal',
  events: {
    disableObservation: emptyProps(),
  },
});

export const routerActions = createActionGroup({
  source: 'Router',
  events: {
    disableObservation: emptyProps(),
    enableObservation: props<{ route: RawGroupRoute }>(),
  },
});

export const groupPageActions = createActionGroup({
  source: 'Group/user page',
  events: {
    hasLoadedAnNonObservableContent: emptyProps(),
    hasLoadedAnObservableContent: props<ObservationInfo>(),
  },
});

export interface FetchedObservedGroupInfo { name: string, currentUserCanGrantAccess: boolean }

export const groupInfoFetchedActions = createActionGroup({
  source: 'Group API',
  events: {
    fetchStateChanged: props<{ route: RawGroupRoute, fetchState: FetchState<FetchedObservedGroupInfo> }>(),
  }
});
