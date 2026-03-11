import { inject } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, combineLatest, filter, fromEvent, skip, tap, withLatestFrom } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { fromWebsocket } from 'src/app/store/websocket';
import {
  subscribeLiveActivityAction,
  unsubscribeLiveActivityAction,
} from '../data-access/websocket-messages/activity-feed-outbound-actions';
import { fromCommunity } from './community.store';

export const liveActivitySubscriptionEffect = createEffect(
  (
    store$ = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.slsWsUrl ? combineLatest([
    store$.select(fromWebsocket.selectOpen),
    store$.select(fromCommunity.selectActivityFeedActive),
  ]).pipe(
    filter(([ wsOpen, active ]) => wsOpen && active),
    tap(() => websocketClient.send(subscribeLiveActivityAction())),
  ) : EMPTY),
  { functional: true, dispatch: false }
);

export const liveActivityUnsubscriptionEffect = createEffect(
  (
    store$ = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.slsWsUrl ? store$.select(fromCommunity.selectActivityFeedActive).pipe(
    skip(1),
    filter(active => !active),
    tap(() => websocketClient.send(unsubscribeLiveActivityAction())),
  ) : EMPTY),
  { functional: true, dispatch: false }
);

export const liveActivityUnsubscribeOnUnloadEffect = createEffect(
  (
    store$ = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.slsWsUrl ? fromEvent(window, 'beforeunload').pipe(
    withLatestFrom(store$.select(fromCommunity.selectActivityFeedActive)),
    filter(([ , active ]) => active),
    tap(() => websocketClient.send(unsubscribeLiveActivityAction())),
  ) : EMPTY),
  { functional: true, dispatch: false }
);
