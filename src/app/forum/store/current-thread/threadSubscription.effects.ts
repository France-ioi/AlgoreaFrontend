import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { map, distinctUntilChanged, tap, withLatestFrom, fromEvent, filter, switchMap, pairwise, EMPTY } from 'rxjs';
import { Store } from '@ngrx/store';
import { areSameThreads } from '../../models/threads';
import { fromForum } from '..';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { subscribeAction, unsubscribeAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { readyData } from 'src/app/utils/operators/state';
import { APPCONFIG } from 'src/app/config';

/**
 * Unsubscribe from the current thread on window.beforeunload.
 * This is done only if there was a token (otherwise a "subscribe" could not have been sent).
 */
export const threadUnsubscriptionOnUnloadEffect = createEffect(
  (
    store = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ?
    fromEvent(window, 'beforeunload').pipe(
      withLatestFrom(store.select(fromForum.selectCurrentThread)),
      tap(([ , state ]) => {
        const thread = state.info.data;
        if (thread) {
          websocketClient.send(unsubscribeAction(thread.token));
        }
      })
    ) : EMPTY),
  { functional: true, dispatch: false }
);

/**
 * Unsubscribe from the previous thread when the thread id changes.
 * Uses pairwise() to capture the previous state before the reducer clears it.
 * This is done only if there was a token (otherwise a "subscribe" could not have been sent).
 */
export const threadUnsubscriptionOnChangeEffect = createEffect(
  (
    store = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ?
    store.select(fromForum.selectCurrentThread).pipe(
      pairwise(),
      filter(([ prev, curr ]) => {
        // Only unsubscribe when: previous had a token AND thread ID actually changed
        if (!prev.info.data || !prev.id) return false;
        return !curr.id || !areSameThreads(prev.id, curr.id);
      }),
      tap(([ prev ]) => {
        websocketClient.send(unsubscribeAction(prev.info.data!.token));
      })
    ) : EMPTY),
  { functional: true, dispatch: false }
);

/**
 * Subscribe to the thread if there is a new thread id for which the token is known.
 * We must also re-subscribe when the websocket reconnects.
 */
export const threadSubscriptionEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ? actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChanged),
    map(({ fetchState }) => fetchState),
    readyData(),
    distinctUntilChanged(areSameThreads),
    // re-emit the thread each time the websocket comes back to `open = true` status
    switchMap(thread => store$.select(fromForum.selectWebsocketOpen).pipe(
      filter(open => open),
      map(() => thread),
    )),
    tap(thread => {
      websocketClient.send(subscribeAction(thread.token));
    })
  ) : EMPTY),
  { functional: true, dispatch: false }
);
