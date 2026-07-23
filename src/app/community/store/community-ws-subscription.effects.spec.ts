import { toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { AppConfig } from 'src/app/config';
import { fromWebsocket } from 'src/app/store/websocket';
import { sentryReporter } from 'src/app/utils/error-handling/error-reporting';
import { subscribeLiveActivityAction, unsubscribeLiveActivityAction } from
  '../data-access/websocket-messages/activity-feed-outbound-actions';
import { fromCommunity } from './community.store';
import {
  liveActivitySubscriptionEffect,
  liveActivityUnsubscriptionEffect,
} from './community-ws-subscription.effects';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const configWithWs = { slsWsUrl: 'wss://example.test' } as AppConfig;
const configWithoutWs = { slsWsUrl: undefined } as AppConfig;

describe('liveActivitySubscriptionEffect', () => {
  let wsClientMock: jasmine.SpyObj<WebsocketClient>;
  let captureException: jasmine.Spy;

  beforeEach(() => {
    wsClientMock = jasmine.createSpyObj<WebsocketClient>('WebsocketClient', ['send']);
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
  });

  it('does nothing when slsWsUrl is unset', done => {
    liveActivitySubscriptionEffect({} as never, wsClientMock, configWithoutWs).pipe(toArray()).subscribe({
      next: values => {
        expect(values.length).toEqual(0);
        expect(wsClientMock.send).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('send failure does not kill the stream', done => {
    testScheduler.run(({ hot }) => {
      const wsOpen$ = hot('1----|', { 1: true });
      const active$ = hot('a-b--|', { a: true, b: true });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromWebsocket.selectOpen) return wsOpen$;
          if (selector === fromCommunity.selectActivityFeedActive) return active$;
          throw new Error('Unknown selector');
        },
      } as never;

      wsClientMock.send.and.callFake(() => {
        if (wsClientMock.send.calls.count() === 1) {
          throw new Error('send failed');
        }
      });

      liveActivitySubscriptionEffect(storeMock$, wsClientMock, configWithWs).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(subscribeLiveActivityAction());
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });
  });
});

describe('liveActivityUnsubscriptionEffect', () => {
  let wsClientMock: jasmine.SpyObj<WebsocketClient>;
  let captureException: jasmine.Spy;

  beforeEach(() => {
    wsClientMock = jasmine.createSpyObj<WebsocketClient>('WebsocketClient', ['send']);
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
  });

  it('does nothing when slsWsUrl is unset', done => {
    liveActivityUnsubscriptionEffect({} as never, wsClientMock, configWithoutWs).pipe(toArray()).subscribe({
      next: values => {
        expect(values.length).toEqual(0);
        expect(wsClientMock.send).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('send failure does not kill the stream', done => {
    testScheduler.run(({ hot }) => {
      // skip(1) then filter(!active): emit true, false (fail), true, false (succeed)
      const active$ = hot('abcd-|', { a: true, b: false, c: true, d: false });

      const storeMock$ = {
        select: () => active$,
      } as never;

      wsClientMock.send.and.callFake(() => {
        if (wsClientMock.send.calls.count() === 1) {
          throw new Error('send failed');
        }
      });

      liveActivityUnsubscriptionEffect(storeMock$, wsClientMock, configWithWs).pipe(toArray()).subscribe({
        next: () => {
          expect(wsClientMock.send).toHaveBeenCalledWith(unsubscribeLiveActivityAction());
          expect(wsClientMock.send).toHaveBeenCalledTimes(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });
  });
});
