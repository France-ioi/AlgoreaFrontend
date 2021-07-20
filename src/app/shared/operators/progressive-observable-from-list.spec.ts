import { switchMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { progressiveObservableFromList } from './progressive-observable-from-list';

describe('progressiveListFromList operator', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should populate list by chunks of 2 items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x-- x--x-');
      const result = cold('  -(1|            ', { 1: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('----1--2--(3|   ', {
        1: [ 1, 2 ],
        2: [ 1, 2, 3, 4 ],
        3: [ 1, 2, 3, 4, 5 ],
      });
      const list = result.pipe(switchMap(list => progressiveObservableFromList(list, { incrementSize: 2, interval: () => interval })));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should populate list by chunks of 2 items starting 3rd item', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x-- x--x-');
      const result = cold('  -(1|            ', { 1: [ 1, 2, 3, 4, 5, 6 ] });
      const expected = cold('----1--2--(3|   ', {
        1: [ 1, 2, 3 ],
        2: [ 1, 2, 3, 4, 5 ],
        3: [ 1, 2, 3, 4, 5, 6 ],
      });
      const list = result.pipe(
        switchMap(list => progressiveObservableFromList(list, { incrementSize: 2, initialIncrementSize: 3, interval: () => interval })),
      );
      expectObservable(list).toEqual(expected);
    });
  });

  it('should populate the whole list when start index exceed list length', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x-- x ');
      const result = cold('  -(1|   ', { 1: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('----(1|', { 1: [ 1, 2, 3, 4, 5 ] });
      const list = result.pipe(
        switchMap(list => progressiveObservableFromList(list, { incrementSize: 2, initialIncrementSize: 5, interval: () => interval })),
      );
      expectObservable(list).toEqual(expected);
    });
  });

  it('should populate the whole list when size exceeds list length', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x-- x ');
      const result = cold('  -(1|   ', { 1: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('----(1|', { 1: [ 1, 2, 3, 4, 5 ] });
      const list = result.pipe(switchMap(list => progressiveObservableFromList(list, { incrementSize: 5, interval: () => interval })));
      expectObservable(list).toEqual(expected);
    });
  });

});
