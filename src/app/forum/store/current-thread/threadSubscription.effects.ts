import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { map, distinctUntilChanged, tap, withLatestFrom, fromEvent, merge, filter, switchMap, EMPTY } from 'rxjs';
import { Store } from '@ngrx/store';
import { areSameThreads } from '../../models/threads';
import { fromForum } from '..';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { subscribeAction, unsubscribeAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { readyData } from 'src/app/utils/operators/state';
import { forumThreadListActions, itemPageActions } from './current-thread.actions';
import { APPCONFIG } from 'src/app/config';

/**
 * Unsubscribe from the thread in two cases:
 * - on window.beforeunload
 * - if the thread id change
 * This is done only if there was a token for the former thread (otherwise a "subscribe" could not have have been sent)
 */
export const threadUnsubscriptionEffect = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ?
    merge(
      fromEvent(window, 'beforeunload'),
      actions$.pipe(
        ofType(forumThreadListActions.showAsCurrentThread, itemPageActions.changeCurrentThreadId),
        map(({ id }) => id),
        distinctUntilChanged(areSameThreads), // only when the id really changes
      )
    ).pipe(
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
