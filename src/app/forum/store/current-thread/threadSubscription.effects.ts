import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { combineLatest, tap, withLatestFrom, fromEvent, filter, pairwise, EMPTY } from 'rxjs';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { fromWebsocket } from 'src/app/store/websocket';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { subscribeAction, unsubscribeAction } from '../../data-access/websocket-messages/threads-outbound-actions';
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
        if (thread && state.visible) {
          websocketClient.send(unsubscribeAction(thread.token));
        }
      })
    ) : EMPTY),
  { functional: true, dispatch: false }
);

/**
 * Unsubscribe when panel becomes hidden or thread changes.
 * Uses pairwise() to capture the previous state.
 */
export const threadUnsubscriptionEffect = createEffect(
  (
    store = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ?
    store.select(fromForum.selectCurrentThread).pipe(
      pairwise(),
      // Only unsubscribe if previous state had a token and was visible
      filter(([ prev ]) => !!prev.info.data && prev.visible),
      filter(([ prev, curr ]) => {
        // Unsubscribe when: visibility changed to false OR thread changed
        const visibilityChanged = prev.visible && !curr.visible;
        const threadChanged = !!(prev.id && curr.id &&
          (prev.id.participantId !== curr.id.participantId || prev.id.itemId !== curr.id.itemId));
        const threadCleared = !!(prev.id && !curr.id);
        return visibilityChanged || threadChanged || threadCleared;
      }),
      tap(([ prev ]) => {
        websocketClient.send(unsubscribeAction(prev.info.data!.token));
      })
    ) : EMPTY),
  { functional: true, dispatch: false }
);

/**
 * Subscribe when panel becomes visible and we have a token.
 * Also re-subscribes when websocket reconnects while panel is visible.
 */
export const threadSubscriptionEffect = createEffect(
  (
    store$ = inject(Store),
    websocketClient = inject(WebsocketClient),
    config = inject(APPCONFIG),
  ) => (config.featureFlags.enableForum ?
    combineLatest([
      store$.select(fromForum.selectCurrentThread),
      store$.select(fromWebsocket.selectOpen),
    ]).pipe(
      pairwise(),
      filter(([ , [ thread, wsOpen ] ]) => thread.visible && !!thread.info.data && wsOpen),
      filter(([ [ prevThread, prevWsOpen ], [ currThread, currWsOpen ] ]) => {
        // Subscribe when: token changes OR websocket just opened
        const tokenChanged = prevThread.info.data?.token !== currThread.info.data?.token;
        const wsJustOpened = !prevWsOpen && currWsOpen;
        return tokenChanged || wsJustOpened;
      }),
      tap(([ , [ thread ] ]) => {
        websocketClient.send(subscribeAction(thread.info.data!.token));
      })
    ) : EMPTY),
  { functional: true, dispatch: false }
);
