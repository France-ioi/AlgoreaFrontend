/* eslint-disable no-multi-spaces */
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { mapPending } from './map-pending';

describe('mapPending operator', () => {

  const stateToLetter = () => map((pending: boolean) => {
    if (pending) return 't'; // true
    else return 'f'; // false
  });

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should work with one event', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const e1 =  cold('---a--|');
      const expected = 't--f--|';
      expectObservable(e1.pipe(mapPending(), stateToLetter())).toBe(expected);
    });
  });

  it('should work with one error', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const e1 =  cold('--- #');
      const expected = 't--(f|';
      expectObservable(e1.pipe(mapPending(), stateToLetter())).toBe(expected);
    });
  });

});
