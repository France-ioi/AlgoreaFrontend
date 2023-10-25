import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { map, distinctUntilChanged, tap, withLatestFrom, fromEvent, merge } from 'rxjs';
import { Store } from '@ngrx/store';
import { areSameThreads } from '../../models/threads';
import forum from '..';
import { ForumWebsocketClient } from '../../data-access/forum-websocket-client.service';
import { subscribeAction, unsubscribeAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { readyData } from 'src/app/utils/operators/state';
import { forumThreadListActions, itemPageActions } from './current-thread.actions';

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
    websocketClient = inject(ForumWebsocketClient),
  ) =>
    merge(
      fromEvent(window, 'beforeunload'),
      actions$.pipe(
        ofType(forumThreadListActions.showAsCurrentThread, itemPageActions.currentThreadIdChange),
        map(({ id }) => id),
        distinctUntilChanged(areSameThreads), // only when the id really changes
      )
    ).pipe(
      withLatestFrom(store.select(forum.selectCurrentThread)),
      tap(([ , state ]) => {
        const thread = state.info.data;
        if (thread) {
          websocketClient.send(unsubscribeAction(thread.token));
        }
      })
    ),
  { functional: true, dispatch: false }
);

/**
 * Subscribe to the thread if there is a new thread id for which the token is known.
 */
export const threadSubscriptionEffect = createEffect(
  (
    actions$ = inject(Actions),
    websocketClient = inject(ForumWebsocketClient),
  ) => actions$.pipe(
    ofType(fetchThreadInfoActions.fetchStateChange),
    map(({ fetchState }) => fetchState),
    readyData(),
    distinctUntilChanged(areSameThreads),
    tap(thread => {
      websocketClient.send(subscribeAction(thread.token));
    })
  ),
  { functional: true, dispatch: false }
);
