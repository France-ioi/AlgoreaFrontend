import { toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { AppConfig } from 'src/app/config';
import { readyState, fetchingState } from 'src/app/utils/state';
import { sentryReporter } from 'src/app/utils/error-handling/error-reporting';
import { Thread } from '../../models/threads';
import { subscribeAction, unsubscribeAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { fromForum } from '..';
import { fromWebsocket } from 'src/app/store/websocket';
import { threadSubscriptionEffect, threadUnsubscriptionEffect } from './threadSubscription.effects';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const mockThread1 = { itemId: '1', participantId: '2', token: 'token1' } as Thread;
const mockThread2 = { itemId: '1', participantId: '3', token: 'token2' } as Thread;
const config = { slsWsUrl: 'mockurl', slsApiUrl: 'anotherurl', featureFlags: { enableForum: true } } as AppConfig;

const createThreadState = (
  visible: boolean,
  thread: Thread | null,
) => ({
  visible,
  id: thread ? { participantId: thread.participantId, itemId: thread.itemId } : null,
  info: thread ? readyState(thread) : fetchingState(),
  logEvents: fetchingState(),
  slsEvents: fetchingState(),
  wsEvents: [],
});

describe('threadSubscription effects send resilience', () => {
  let wsClientMock: jasmine.SpyObj<WebsocketClient>;
  let captureException: jasmine.Spy;

  beforeEach(() => {
    wsClientMock = jasmine.createSpyObj<WebsocketClient>('WebsocketClient', ['send']);
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
  });

  it('threadSubscriptionEffect: send failure does not kill the stream', done => {
    testScheduler.run(({ hot }) => {
      const token$ = hot('  a-b--|', { a: 'token1', b: 'token2' });
      const visible$ = hot('1----|', { 1: true });
      const wsOpen$ = hot(' 1----|', { 1: true });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectThreadToken) return token$;
          if (selector === fromForum.selectVisible) return visible$;
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          throw new Error('Unknown selector');
        },
      } as never;

      wsClientMock.send.and.callFake(() => {
        if (wsClientMock.send.calls.count() === 1) {
          throw new Error('send failed');
        }
      });

      threadSubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(subscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledWith(subscribeAction('token2'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });
  });

  it('threadUnsubscriptionEffect: send failure does not kill the stream', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('-abcd|', {
        a: createThreadState(true, mockThread1),
        b: createThreadState(false, mockThread1),
        c: createThreadState(true, mockThread2),
        d: createThreadState(false, mockThread2),
      });

      const storeMock$ = {
        select: () => threadState$,
      } as never;

      wsClientMock.send.and.callFake(() => {
        if (wsClientMock.send.calls.count() === 1) {
          throw new Error('send failed');
        }
      });

      threadUnsubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(unsubscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledWith(unsubscribeAction('token2'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });
  });
});
