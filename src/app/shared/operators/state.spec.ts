/* eslint-disable no-multi-spaces */
import { OperatorFunction, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { FetchState } from '../helpers/state';
import { mapToFetchState } from './state';

function stateToLetter(): OperatorFunction<FetchState<string>, string> {
  return pipe(
    map(state => {
      if (state.isReady) return state.data;
      if (state.isFetching) return 'l';
      if (state.isError) return 'e';
      return '?';
    })
  );
}

describe('mapToState', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should work with 1 event', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const e1 =  cold('---a---|');
      const subs =     '^------!';
      const expected = 'l--a---|';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(subs);
    });
  });

  it('should work with no events', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const e1 =  cold('-------|');
      const subs =     '^------!';
      const expected = 'l------|';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(subs);
    });
  });

  it('should work with several events', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const e1 =  cold('--a-b--|');
      const subs =     '^------!';
      const expected = 'l-a-b--|';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(subs);
    });
  });

  it('should work with an error', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const e1 =  cold('------- #');
      const subs =     '^------ !';
      const expected = 'l------(e|)';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(subs);
    });
  });

  it('should work with an event followed by an error', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const e1 =  cold('---a--- #');
      const subs =     '^------ !';
      const expected = 'l--a---(e|)';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(subs);
    });
  });

});
