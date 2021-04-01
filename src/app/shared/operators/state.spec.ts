/* eslint-disable no-multi-spaces */
import { OperatorFunction, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { errorState, fetchingState, FetchState, readyState } from '../helpers/state';
import { mapToFetchState, readyOnly } from './state';

const stateToLetter = (): OperatorFunction<FetchState<string>, string> => pipe(
  map(state => {
    if (state.isReady) return state.data;
    if (state.isFetching) return 'l';
    if (state.isError) return 'e';
    return '?';
  })
);

const letterToState = (): OperatorFunction<string, FetchState<string>> => pipe(
  map(l => {
    switch (l) {
      case 'f': return fetchingState();
      case 'e': return errorState(new Error());
      default: return readyState(l);
    }
  })
);

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


describe('readyOnly', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should keep only ready events (and not to skip some)', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e =   cold('-f-a-b-f-e-#');
      const expected = '---a-b-----#';

      expectObservable(e.pipe(
        letterToState(),
        readyOnly(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

});
