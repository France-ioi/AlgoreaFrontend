/* eslint-disable no-multi-spaces */
import { OperatorFunction, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { errorState, fetchingState, FetchState, readyState } from '../helpers/state';
import { mapErrorToState, mapStateData, mapToFetchState, readyData } from './state';

const stateToLetter = (): OperatorFunction<FetchState<string>, string> => pipe(
  map(state => {
    if (state.isReady && state.data === '1') return 'a';
    if (state.isReady && state.data === '2') return 'b';
    if (state.isFetching && !state.data) return 'f';
    if (state.isFetching && state.data === '1') return 'g';
    if (state.isFetching && state.data === '2') return 'h';
    if (state.isError) return 'x';
    throw new Error('encoding error');
  })
);

const letterToState = (): OperatorFunction<string, FetchState<string>> => pipe(
  map(l => {
    switch (l) {
      case 'a': return readyState('1');
      case 'b': return readyState('2');
      case 'f': return fetchingState();
      case 'g': return fetchingState('1');
      case 'h': return fetchingState('2');
      case 'x': return errorState(new Error());
      default: throw new Error('decoding error');
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
      const e1 =  cold('---1---|');
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
      const e1 =  cold('--1-2--|');
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
      const expected = 'f------(x|)';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should work with an event followed by an error', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('---1--- #');
      const expected = 'f--a---(x|)';

      expectObservable(e1.pipe(
        mapToFetchState(),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should retry work with a resetter not completing immediately', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('-1|');
      const res = cold('----0----|'); // the values are not important for the resetter
      const expected = 'fa--ga---|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should retry work with multiple resets', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('-1|');
      const res = cold('----0--0-----0|'); // the values are not important for the resetter
      const expected = 'fa--ga-ga----ga|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should retry even after a source failure', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('-#|');
      const res = cold('----0--0--|');
      const expected = 'fx--fx-fx-|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should allow several fetching states with no data', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('---1|');
      const res = cold('-0------|'); // the values are not important for the resetter
      const expected = 'ff--a---|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should pass data between fetching states', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('--1|');
      const res = cold('----00----|'); // the values are not important for the resetter
      const expected = 'f-a-gg-a--|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should not replay the last data after a failure', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('-1-#');
      const res = cold('-------0------|');
      const expected = 'fa-x---fa-x---|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should change the data in state as expected', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e1 =  cold('--1--2|');
      const res = cold('----0------0-----|'); // the values are not important for the resetter
      const expected = 'f-a-g-a--b-h-a--b|';

      expectObservable(e1.pipe(
        mapToFetchState({ resetter: res }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

});


describe('readyData', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should keep only ready events (and not to skip some)', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e =   cold('-f-a-b-f-g-x-#');
      const expected = '---1-2-------#';

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
      const e =   cold('-f-a-b-g-x-#');
      const expected = '-f-b-b-h-x-#';

      expectObservable(e.pipe(
        letterToState(),
        mapStateData(_x => '2'),
        stateToLetter(),
      )).toBe(expected);
    });
  });

});


describe('mapErrorToState', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should work as expected', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const e =   cold('-1-#');
      const expected = '-a-(x|)';

      expectObservable(e.pipe(
        map(v => readyState(v)),
        mapErrorToState(),
        stateToLetter(),
      )).toBe(expected);

    });
  });

});
