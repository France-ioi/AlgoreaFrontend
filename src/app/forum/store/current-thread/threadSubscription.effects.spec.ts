import { toArray } from 'rxjs';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { readyState, fetchingState } from 'src/app/utils/state';
import { Thread } from '../../models/threads';
import { threadSubscriptionEffect, threadUnsubscriptionEffect } from './threadSubscription.effects';
import { TestScheduler } from 'rxjs/testing';
import { AppConfig } from 'src/app/config';
import { subscribeAction, unsubscribeAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { fromForum } from '..';
import { fromWebsocket } from 'src/app/store/websocket';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const mockThread1 = { itemId: '1', participantId: '2', token: 'token1' } as Thread;
const mockThread2 = { itemId: '1', participantId: '3', token: 'token2' } as Thread;
const config = { slsWsUrl: 'mockurl', slsApiUrl: 'anotherurl', featureFlags: { enableForum: true } } as AppConfig;

const createThreadState = (
  visible: boolean,
  thread: Thread | null,
  id?: { participantId: string, itemId: string }
) => ({
  visible,
  id: id ?? (thread ? { participantId: thread.participantId, itemId: thread.itemId } : null),
  info: thread ? readyState(thread) : fetchingState(),
  logEvents: fetchingState(),
  slsEvents: fetchingState(),
  wsEvents: [],
});

describe('threadSubscriptionEffect', () => {
  let wsClientMock: jasmine.SpyObj<WebsocketClient>;

  beforeEach(() => {
    wsClientMock = jasmine.createSpyObj<WebsocketClient>('WebsocketClient', ['send']);
  });

  it('subscribes when panel becomes visible with token and ws open', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('--a--|', { a: createThreadState(true, mockThread1) });
      const wsOpen$ = hot('     1----|', { 1: true });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectCurrentThread) return threadState$;
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          throw new Error('Unknown selector');
        }
      } as never;

      threadSubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(subscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  it('does not subscribe when panel is not visible', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('--a--|', { a: createThreadState(false, mockThread1) });
      const wsOpen$ = hot('     1----|', { 1: true });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectCurrentThread) return threadState$;
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          throw new Error('Unknown selector');
        }
      } as never;

      threadSubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('does not subscribe when ws is not open', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('--a--|', { a: createThreadState(true, mockThread1) });
      const wsOpen$ = hot('     0----|', { 0: false });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectCurrentThread) return threadState$;
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          throw new Error('Unknown selector');
        }
      } as never;

      threadSubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('resubscribes when ws reconnects while panel is visible', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('a------|', { a: createThreadState(true, mockThread1) });
      // Simulate reconnection: open → close → reopen
      const wsOpen$ = hot('     1--01--|', { 0: false, 1: true });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectCurrentThread) return threadState$;
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          throw new Error('Unknown selector');
        }
      } as never;

      threadSubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          // Should subscribe twice: once when ws opens initially, once when it reconnects
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          done();
        }
      });
    });
  });

  it('subscribes with new token when thread changes', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('a-b--|', {
        a: createThreadState(true, mockThread1),
        b: createThreadState(true, mockThread2),
      });
      const wsOpen$ = hot('     1----|', { 1: true });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectCurrentThread) return threadState$;
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          throw new Error('Unknown selector');
        }
      } as never;

      threadSubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(subscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledWith(subscribeAction('token2'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          done();
        }
      });
    });
  });
});

describe('threadUnsubscriptionEffect', () => {
  let wsClientMock: jasmine.SpyObj<WebsocketClient>;

  beforeEach(() => {
    wsClientMock = jasmine.createSpyObj<WebsocketClient>('WebsocketClient', ['send']);
  });

  it('unsubscribes when panel becomes hidden', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('-ab--|', {
        a: createThreadState(true, mockThread1),
        b: createThreadState(false, mockThread1),
      });

      const storeMock$ = {
        select: () => threadState$
      } as never;

      threadUnsubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(unsubscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  it('unsubscribes when thread changes', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('-ab--|', {
        a: createThreadState(true, mockThread1),
        b: createThreadState(true, mockThread2),
      });

      const storeMock$ = {
        select: () => threadState$
      } as never;

      threadUnsubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(unsubscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  it('does not unsubscribe when panel was not visible', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('-ab--|', {
        a: createThreadState(false, mockThread1),
        b: createThreadState(false, mockThread1),
      });

      const storeMock$ = {
        select: () => threadState$
      } as never;

      threadUnsubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('does not unsubscribe when no token was available', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('-ab--|', {
        a: { ...createThreadState(true, null), id: { participantId: '1', itemId: '2' } },
        b: createThreadState(false, null),
      });

      const storeMock$ = {
        select: () => threadState$
      } as never;

      threadUnsubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('unsubscribes when thread is cleared', done => {
    testScheduler.run(({ hot }) => {
      const threadState$ = hot('-ab--|', {
        a: createThreadState(true, mockThread1),
        b: { ...createThreadState(true, null), id: null },
      });

      const storeMock$ = {
        select: () => threadState$
      } as never;

      threadUnsubscriptionEffect(storeMock$, wsClientMock, config).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(unsubscribeAction('token1'));
          expect(wsClientMock.send).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });
});
