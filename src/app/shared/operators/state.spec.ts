/* eslint-disable no-multi-spaces */
import { OperatorFunction, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { errorState, fetchingState, FetchState, readyState } from '../helpers/state';
import { mapStateData, mapToFetchState, readyData } from './state';

const stateToLetter = (): OperatorFunction<FetchState<string>, string> => pipe(
  map(state => {
    if (state.isReady) return state.data;
    if (state.isFetching) return 'f';
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
      const { cold, expectObservable } = helpers;
      const e1 =  cold('---a---|');
      const expected = 'f--a---|';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should work with no events', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('-------|');
      const expected = 'f------|';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should work with several events', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('--a-b--|');
      const expected = 'f-a-b--|';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should work with an error', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('------- #');
      const expected = 'f------(e|)';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should work with an event followed by an error', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('---a--- #');
      const expected = 'f--a---(e|)';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

});


describe('readyState', () => {

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
        readyData(),
      )).toBe(expected);
    });
  });

});


describe('mapStateData', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should work as expected', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e =   cold('-f-a-b-f-e-#');
      const expected = '-f-z-z-f-e-#';

      expectObservable(e.pipe(
        letterToState(),
        mapStateData(_x => 'z'),
        stateToLetter(),
      )).toBe(expected);
    });
  });

});
