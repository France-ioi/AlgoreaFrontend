/* eslint-disable no-multi-spaces */
import { Observable, OperatorFunction, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { errorState, fetchingState, FetchState, readyState } from '../../utils/state';
import { mapErrorToState, mapStateData, mapToFetchState, readyData, switchMapToFetchState } from './state';

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


describe('switchMapToFetchState', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  // Extended encoding for case 7 (three-input test): readyState('3') -> 'c', fetchingState('3') -> 'i'.
  const stateToLetterExtended = (): OperatorFunction<FetchState<string>, string> => pipe(
    map(state => {
      if (state.isReady && state.data === '1') return 'a';
      if (state.isReady && state.data === '2') return 'b';
      if (state.isReady && state.data === '3') return 'c';
      if (state.isFetching && !state.data) return 'f';
      if (state.isFetching && state.data === '1') return 'g';
      if (state.isFetching && state.data === '2') return 'h';
      if (state.isFetching && state.data === '3') return 'i';
      if (state.isError) return 'x';
      throw new Error('encoding error');
    })
  );

  const fetchFromMap = (
    spec: Record<string, string>,
    cold: typeof TestScheduler.prototype.createColdObservable,
  ): (input: string) => Observable<string> => (input: string): Observable<string> => cold(spec[input]!, { x: input });

  it('should emit fetching then ready for a single input', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const inputs =  cold('-x|', { x: '1' });
      const expected =     '-fa|';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-x|' }, cold)),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should carry previousData into the fetching state of the next input', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const inputs =  cold('-x---y|', { x: '1', y: '2' });
      const expected =     '-fa--gb|';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-x|', '2': '-x|' }, cold)),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should expose a fetch error as an error state and stay subscribed to inputs', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const inputs =  cold('-x|', { x: '1' });
      const expected =     '-f(x|)';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-#' }, cold)),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should recover on the next input after a previous fetch errored (regression)', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const inputs =  cold('-x---y|', { x: '1', y: '2' });
      const expected =     '-fx--fb|';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-#', '2': '-x|' }, cold)),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should re-fire the fetch when the resetter emits after a ready', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      // The resetter is subscribed when the input arrives (frame 1), not at outer subscription
      // time. Its marble offsets are therefore relative to frame 1.
      const inputs =  cold('-x------|', { x: '1' });
      const resetter = cold('----0--|'); // '0' at outer frame 5, '|' at outer frame 8.
      const expected =     '-fa--ga-|';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-x|' }, cold), { resetter }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should re-fire the fetch when the resetter emits after an error', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const inputs =  cold('-x------|', { x: '1' });
      const resetter = cold('----0--|');
      const expected =     '-fx--fx-|';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-#' }, cold), { resetter }),
        stateToLetter(),
      )).toBe(expected);
    });
  });

  it('should clear previousData on error so the next fetching state has undefined data', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      // Frame 1: f (initial fetching). Frame 2: a (ready '1'). Frame 3: g (fetching with prev '1').
      // Frame 4: x (error clears prev). Frame 5: f (fetching with prev=undefined, the assertion).
      // Frame 6: c (ready '3'). Frame 7: completion.
      const inputs =  cold('-x-y-z|', { x: '1', y: '2', z: '3' });
      const expected =     '-fagxfc|';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({ '1': '-x|', '2': '-#', '3': '-x|' }, cold)),
        stateToLetterExtended(),
      )).toBe(expected);
    });
  });

  it('should convert an error from the upstream inputs source into an error state', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const inputs =  cold('-#');
      const expected =     '-(x|)';

      expectObservable(inputs.pipe(
        switchMapToFetchState(fetchFromMap({}, cold)),
        stateToLetter(),
      )).toBe(expected);
    });
  });

});
