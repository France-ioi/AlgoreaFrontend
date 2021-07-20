import { TestScheduler } from 'rxjs/testing';
import { setListByBatch } from './set-list-by-batch';

describe('setListByBatch operator', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should append all list items 2 by 2', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x-- x--x-');
      const result = cold('  -(1|            ', { 1: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('----1--2--(3|   ', {
        1: [ 1, 2 ],
        2: [ 1, 2, 3, 4 ],
        3: [ 1, 2, 3, 4, 5 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should append all list items at once', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval= hot('  -x - - x ');
      const result = cold('  --(1|    ', { 1: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('-- - -(1|', { 1: [ 1, 2, 3, 4, 5 ] });
      const list = result.pipe(setListByBatch({ size: 6, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should set only new list items when switching before next interval', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' --x--x--x--x--');
      const result = cold('  ---12--------|', { 1: [ 1, 2, 3, 4, 5 ], 2: [ 3, 2, 1 ] });
      const expected = cold('-----1--2----|', {
        1: [ 3, 2 ],
        2: [ 3, 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should replace existing old list items by new and set last items of new list when switching between intervals', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x--x--x--x--');
      const result = cold('  --1-----2---------|', { 1: [ 1, 2, 3, 4, 5 ], 2: [ 5, 4, 3, 2, 1 ] });
      const expected = cold('----1--2--3--4----|', {
        1: [ 1, 2 ],
        2: [ 1, 2, 3, 4 ],
        3: [ 5, 4, 3, 2 ],
        4: [ 5, 4, 3, 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should replace old list items by the new ones and remove exceeding items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x--x - - x ');
      const result = cold('  -1---------(2|    ', { 1: [ 1, 2, 3, 4, 5, 6 ], 2: [ 2, 1 ] });
      const expected = cold('----1--2--3 - -(4|', {
        1: [ 1, 2 ],
        2: [ 1, 2, 3, 4 ],
        3: [ 1, 2, 3, 4, 5, 6 ],
        4: [ 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should remove all items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x--x - - x ');
      const result = cold('  -1---------(2|   ', { 1: [ 1, 2, 3, 4, 5, 6 ], 2: [] as number[] });
      const expected = cold('----1--2--3 - -(4|', {
        1: [ 1, 2 ],
        2: [ 1, 2, 3, 4 ],
        3: [ 1, 2, 3, 4, 5, 6 ],
        4: [],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should replace old list items by the new list items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x--x--x--x-- x ');
      const result = cold('  --1--------2|   ', { 1: [ 1, 2, 3, 4 ], 2: [ 4, 3, 2, 1 ] });
      const expected = cold('----1--2-----(3|', {
        1: [ 1, 2 ],
        2: [ 1, 2, 3, 4 ],
        3: [ 4, 3, 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should stop appending list items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -x - -x--x-');
      const result = cold('  --(1|      ', { 1: [ 1, 2, 3, 4, 5, 6, 7, 8 ] });
      const cancel = hot('   -- - ---1--');
      const expected = cold('-- - -1-|  ', { 1: [ 1, 2 ] });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval, until: cancel }));
      expectObservable(list).toEqual(expected);
    });
  });

});
