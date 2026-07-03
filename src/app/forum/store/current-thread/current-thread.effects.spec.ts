import { toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { AppConfig } from 'src/app/config';
import { readyState } from 'src/app/utils/state';
import { sentryReporter } from 'src/app/utils/error-handling/error-reporting';
import { Thread } from '../../models/threads';
import { fromForum } from '..';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { fetchStateChangeGuardEffect } from './current-thread.effects';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

const mockThread = { itemId: '1', participantId: '2', token: 'token1' } as Thread;
const mockThread2 = { itemId: '1', participantId: '3', token: 'token2' } as Thread;
const mockThreadId = { itemId: '1', participantId: '2' };
const enabledConfig = { featureFlags: { enableForum: true } } as AppConfig;
const disabledConfig = { featureFlags: { enableForum: false } } as AppConfig;

describe('fetchStateChangeGuardEffect', () => {
  let captureException: jasmine.Spy;

  beforeEach(() => {
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
  });

  it('reports null thread id and continues processing subsequent actions', done => {
    testScheduler.run(({ hot }) => {
      const actions$ = hot('-a-b--|', {
        a: fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread) }),
        b: fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread) }),
      });
      const threadId$ = hot('0-1---|', { 0: null, 1: mockThreadId });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectThreadId) return threadId$;
          throw new Error('Unknown selector');
        }
      } as never;

      fetchStateChangeGuardEffect(actions$, storeMock$, enabledConfig).pipe(toArray()).subscribe({
        next: emissions => {
          expect(emissions.length).toBe(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          expect(captureException).toHaveBeenCalledWith(jasmine.objectContaining({
            message: 'unexpected: no state id while changing thread info',
          }));
          done();
        }
      });
    });
  });

  it('reports mismatched thread id and continues processing subsequent actions', done => {
    testScheduler.run(({ hot }) => {
      const actions$ = hot('-a-b--|', {
        a: fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread2) }),
        b: fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread) }),
      });
      const threadId$ = hot('1-----|', { 1: mockThreadId });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectThreadId) return threadId$;
          throw new Error('Unknown selector');
        }
      } as never;

      fetchStateChangeGuardEffect(actions$, storeMock$, enabledConfig).pipe(toArray()).subscribe({
        next: emissions => {
          expect(emissions.length).toBe(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          expect(captureException).toHaveBeenCalledWith(jasmine.objectContaining({
            message: 'unexpected: fetch state thread <> state id',
          }));
          done();
        }
      });
    });
  });

  it('does nothing when forum feature flag is disabled', done => {
    testScheduler.run(({ hot }) => {
      const actions$ = hot('-a--|', {
        a: fetchThreadInfoActions.fetchStateChanged({ fetchState: readyState(mockThread) }),
      });
      const threadId$ = hot('1---|', { 1: null });

      const storeMock$ = {
        select: (selector: unknown) => {
          if (selector === fromForum.selectThreadId) return threadId$;
          throw new Error('Unknown selector');
        }
      } as never;

      fetchStateChangeGuardEffect(actions$, storeMock$, disabledConfig).pipe(toArray()).subscribe({
        next: emissions => {
          expect(emissions.length).toBe(0);
          expect(captureException).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
