import { TestScheduler } from 'rxjs/testing';
import { setListByBatch } from './set-list-by-batch';

fdescribe('setListByBatch operator', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should append all list items 2 by 2', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -f--f--f-- f--f--f--f--f');
      const result = cold('  -(x|', { x: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('----a--b--(c|', {
        a: [ 1, 2 ],
        b: [ 1, 2, 3, 4 ],
        c: [ 1, 2, 3, 4, 5 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should append all list items at once', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval= hot('  -f -- f--f--f--f--f--f--f');
      const result = cold('  --(x|', { x: [ 1, 2, 3, 4, 5 ] });
      const expected = cold('-- --(a|', { a: [ 1, 2, 3, 4, 5 ] });
      const list = result.pipe(setListByBatch({ size: 6, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should set only new list items when switching before next interval', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' --f--f--f--f--f--f--f--f');
      const result = cold('  ---xy--------|', { x: [ 1, 2, 3, 4, 5 ], y: [ 3, 2, 1 ] });
      const expected = cold('-----a--b----|', {
        a: [ 3, 2 ],
        b: [ 3, 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should replace existing old list items by new and set last items of new list when switching between intervals', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -f--f--f--f--f--f--f--f');
      const result = cold('  --x-----y---------|', { x: [ 1, 2, 3, 4, 5 ], y: [ 5, 4, 3, 2, 1 ] });
      const expected = cold('----a--b--c--d----|', {
        a: [ 1, 2 ],
        b: [ 1, 2, 3, 4 ],
        c: [ 5, 4, 3, 2 ],
        d: [ 5, 4, 3, 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should replace old list items by the new ones and remove exceeding items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -f--f--f--f -- f--f--f--f');
      const result = cold('  -x---------(y|', { x: [ 1, 2, 3, 4, 5, 6 ], y: [ 2, 1 ] });
      const expected = cold('----a--b--c --(d|', {
        a: [ 1, 2 ],
        b: [ 1, 2, 3, 4 ],
        c: [ 1, 2, 3, 4, 5, 6 ],
        d: [ 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should remove all items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -f--f--f--f -- f--f--f--f');
      const result = cold('  -x---------(y|', { x: [ 1, 2, 3, 4, 5, 6 ], y: [] as number[] });
      const expected = cold('----a--b--c --(d|', {
        a: [ 1, 2 ],
        b: [ 1, 2, 3, 4 ],
        c: [ 1, 2, 3, 4, 5, 6 ],
        d: [],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should replace old list items by the new list items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -f--f--f--f-- f--f--f--f');
      const result = cold('  --x--------y|', { x: [ 1, 2, 3, 4 ], y: [ 4, 3, 2, 1 ] });
      const expected = cold('----a--b-----(c|', {
        a: [ 1, 2 ],
        b: [ 1, 2, 3, 4 ],
        c: [ 4, 3, 2, 1 ],
      });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval }));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should stop appending list items', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const interval = hot(' -f --f--f--f--f--f--f--f');
      const result = cold('  --(x|', { x: [ 1, 2, 3, 4, 5, 6, 7, 8 ] });
      const cancel = hot('   -- ----1---');
      const expected = cold('-- --a-|', { a: [ 1, 2 ] });
      const list = result.pipe(setListByBatch({ size: 2, interval: () => interval, until: cancel }));
      expectObservable(list).toEqual(expected);
    });
  });

});
