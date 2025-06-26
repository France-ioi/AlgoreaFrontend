import { shareReplay } from 'rxjs';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { fetchingState, readyState } from 'src/app/utils/state';
import { Thread } from '../../models/threads';
import { threadSubscriptionEffect } from './threadSubscription.effects';
import { Store } from '@ngrx/store';
import { TestScheduler } from 'rxjs/testing';
import { AppConfig } from 'src/app/config';

describe('threadSubscriptionEffect', () => {

  const mockThread1 = { itemId: '1', participantId: '2' } as Thread;
  const mockThread2 = { itemId: '1', participantId: '3' } as Thread;
  const wsClientMock = {
    send: (): void => {}
  } as unknown as WebsocketClient;
  const config = { forumServerUrl: 'mockurl' } as AppConfig;

  // actions for marble testing
  const a = fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread1) });
  const b = fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread2) });
  const c = fetchThreadInfoActions.fetchStateChanged({ fetchState: fetchingState(mockThread1) });

  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  beforeEach(() => {
    spyOn(wsClientMock, 'send');
  });

  it('subscribes to each new thread (only once) while the ws is open', done => {
    testScheduler.run(({ hot }) => {
      const actionsMock$ = hot('       -a-b-a-a-b-c-|', { a, b, c });
      const selectWebsocketOpen = hot('1------------|', { 1: true }).pipe(shareReplay(1));
      selectWebsocketOpen.subscribe(); // to ensure the observable starts immediately

      const storeMock$ = {
        select: () => selectWebsocketOpen
      } as unknown as Store;

      threadSubscriptionEffect(actionsMock$, storeMock$, wsClientMock, config).subscribe({
        complete: () => {
          expect(wsClientMock.send).toHaveBeenCalledTimes(4);
          done();
        }
      });
    });

  });

  it('resubscribes to thread each time the ws reconnects', done => {
    testScheduler.run(({ hot }) => {
      const actionsMock$ = hot('       -------a-------|', { a });
      const selectWebsocketOpen = hot('0-1-0-1-0-1-0-1|', { 1: true , 0: false }).pipe(shareReplay(1));
      selectWebsocketOpen.subscribe();// to ensure the observable starts immediately

      const storeMock$ = {
        select: () => selectWebsocketOpen
      } as unknown as Store;

      threadSubscriptionEffect(actionsMock$, storeMock$, wsClientMock, config).subscribe({
        complete: () => {
          expect(wsClientMock.send).toHaveBeenCalledTimes(3);
          done();
        }
      });
    });

  });

  it('wait for the ws to connect to subscribe', done => {
    testScheduler.run(({ hot, cold }) => {
      const actionsMock$ = hot('        -a-------|', { a });
      const selectWebsocketOpen = cold('0---1-0-1|', { 1: true , 0: false }).pipe(shareReplay(1));

      const storeMock$ = {
        select: () => selectWebsocketOpen
      } as unknown as Store;

      threadSubscriptionEffect(actionsMock$, storeMock$, wsClientMock, config).subscribe({
        complete: () => {
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          done();
        }
      });
    });

  });

});
