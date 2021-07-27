import { TestScheduler } from 'rxjs/testing';
import { errorState, fetchingState, FetchState, readyState } from '../helpers/state';
import { withPreviousFetchState } from './with-previous-fetch-state';

describe('withPreviousFetchState', () => {

  type FetchStateTuple = [ FetchState<undefined>, FetchState<undefined> ];
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should provide previous state', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const states = cold('  -a--b-(c|', { a: fetchingState(), b: errorState(new Error('error')), c: readyState(undefined) });
      const expected = cold('-a--b-(c|', {
        a: [ fetchingState(), fetchingState() ] as FetchStateTuple,
        b: [ fetchingState(), errorState(new Error('error')) ] as FetchStateTuple,
        c: [ errorState(new Error('error')), readyState(undefined) ] as FetchStateTuple,
      });
      const result = states.pipe(withPreviousFetchState());
      expectObservable(result).toEqual(expected);
    });
  });

  it('should accept custom initial state', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const states = cold('  --(x|', { x: fetchingState() });
      const expected = cold('--(x|', {
        x: [ errorState(new Error('error')), fetchingState() ] as FetchStateTuple,
      });
      const result = states.pipe(withPreviousFetchState(errorState(new Error('error'))));
      expectObservable(result).toEqual(expected);
    });
  });

});
