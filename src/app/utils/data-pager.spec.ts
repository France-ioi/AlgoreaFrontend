import { Observable, of, Subject, throwError } from 'rxjs';
import { FetchState } from './state';
import { DataPager } from './data-pager';

function createPager(
  fetchFn: (pageSize: number, lastElement?: number) => Observable<number[]>,
  options?: { pageSize?: number, maxPageSize?: number },
): { pager: DataPager<number>, onLoadMoreError: jasmine.Spy } {
  const onLoadMoreError = jasmine.createSpy('onLoadMoreError');
  const pager = new DataPager<number>({
    fetch: fetchFn,
    pageSize: options?.pageSize ?? 3,
    maxPageSize: options?.maxPageSize,
    onLoadMoreError,
  });
  return { pager, onLoadMoreError };
}

function collectStates<T>(obs: Observable<FetchState<T[]>>): FetchState<T[]>[] {
  const states: FetchState<T[]>[] = [];
  obs.subscribe(s => states.push(s));
  return states;
}

describe('DataPager', () => {
  describe('load (initial)', () => {
    it('should emit fetching then ready on first load', () => {
      const { pager } = createPager(() => of([ 1, 2, 3 ]));
      const states = collectStates(pager.list$);
      pager.load();
      expect(states.length).toBe(2);
      expect(states[0]!.isFetching).toBeTrue();
      expect(states[0]!.data).toBeUndefined();
      expect(states[1]!.isReady).toBeTrue();
      expect(states[1]!.data).toEqual([ 1, 2, 3 ]);
    });

    it('should report canLoadMore true when page is full', () => {
      const { pager } = createPager(() => of([ 1, 2, 3 ]));
      let canLoadMore: boolean | undefined;
      pager.canLoadMore$.subscribe(v => canLoadMore = v);
      pager.load();
      expect(canLoadMore).toBeTrue();
    });

    it('should report canLoadMore false when page is not full', () => {
      const { pager } = createPager(() => of([ 1, 2 ]));
      let canLoadMore: boolean | undefined;
      pager.canLoadMore$.subscribe(v => canLoadMore = v);
      pager.load();
      expect(canLoadMore).toBeFalse();
    });

    it('should emit error state on fetch failure', () => {
      const { pager } = createPager(() => throwError(() => new Error('fail')));
      const states = collectStates(pager.list$);
      pager.load();
      expect(states.length).toBe(2);
      expect(states[1]!.isError).toBeTrue();
    });
  });

  describe('loadMore', () => {
    it('should append data to existing list', () => {
      let call = 0;
      const { pager } = createPager(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : [ 4, 5, 6 ]);
      });
      const states = collectStates(pager.list$);
      pager.load();
      pager.load();
      const lastState = states[states.length - 1]!;
      expect(lastState.isReady).toBeTrue();
      expect(lastState.data).toEqual([ 1, 2, 3, 4, 5, 6 ]);
    });

    it('should pass last element to fetch on load more', () => {
      const fetchSpy = jasmine.createSpy('fetch').and.callFake(
        (_pageSize: number, last?: number) => of(last === undefined ? [ 1, 2, 3 ] : [ 4, 5, 6 ])
      );
      const { pager } = createPager(fetchSpy);
      collectStates(pager.list$);
      pager.load();
      pager.load();
      expect(fetchSpy).toHaveBeenCalledWith(3, 3);
    });

    it('should keep old data and call onLoadMoreError on load-more failure', () => {
      let call = 0;
      const { pager, onLoadMoreError } = createPager(() => {
        call++;
        if (call === 1) return of([ 1, 2, 3 ]);
        return throwError(() => new Error('network'));
      });
      const states = collectStates(pager.list$);
      pager.load();
      pager.load();
      const lastState = states[states.length - 1]!;
      expect(lastState.isReady).toBeTrue();
      expect(lastState.data).toEqual([ 1, 2, 3 ]);
      expect(onLoadMoreError).toHaveBeenCalled();
    });

    it('should preserve data during load-more fetching', () => {
      const subject = new Subject<number[]>();
      let call = 0;
      const { pager } = createPager(() => {
        call++;
        if (call === 1) return of([ 1, 2, 3 ]);
        return subject;
      });
      const states = collectStates(pager.list$);
      pager.load();
      pager.load();
      const fetchingState = states[states.length - 1]!;
      expect(fetchingState.isFetching).toBeTrue();
      expect(fetchingState.data).toEqual([ 1, 2, 3 ]);
      subject.next([ 4, 5, 6 ]);
      subject.complete();
    });
  });

  describe('reset', () => {
    it('should clear data and re-fetch from beginning', () => {
      let call = 0;
      const fetchSpy = jasmine.createSpy('fetch').and.callFake(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : [ 10, 20, 30 ]);
      });
      const { pager } = createPager(fetchSpy);
      const states = collectStates(pager.list$);
      pager.load();
      pager.reset();
      const lastState = states[states.length - 1]!;
      expect(lastState.isReady).toBeTrue();
      expect(lastState.data).toEqual([ 10, 20, 30 ]);
      expect(fetchSpy.calls.mostRecent().args[1]).toBeUndefined();
    });
  });

  describe('refresh', () => {
    it('should keep old data visible during refresh fetch', () => {
      const subject = new Subject<number[]>();
      let call = 0;
      const { pager } = createPager(() => {
        call++;
        if (call === 1) return of([ 1, 2, 3 ]);
        return subject;
      });
      const states = collectStates(pager.list$);
      pager.load();
      pager.refresh();
      const fetchingState = states[states.length - 1]!;
      expect(fetchingState.isFetching).toBeTrue();
      expect(fetchingState.data).toEqual([ 1, 2, 3 ]);
      subject.next([ 10, 20, 30 ]);
      subject.complete();
    });

    it('should replace data on refresh success', () => {
      let call = 0;
      const { pager } = createPager(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : [ 10, 20, 30 ]);
      });
      const states = collectStates(pager.list$);
      pager.load();
      pager.refresh();
      const lastState = states[states.length - 1]!;
      expect(lastState.isReady).toBeTrue();
      expect(lastState.data).toEqual([ 10, 20, 30 ]);
    });

    it('should fetch from beginning (no lastElement)', () => {
      const fetchSpy = jasmine.createSpy('fetch').and.returnValue(of([ 1, 2, 3 ]));
      const { pager } = createPager(fetchSpy);
      collectStates(pager.list$);
      pager.load();
      pager.refresh();
      expect(fetchSpy.calls.mostRecent().args[1]).toBeUndefined();
    });

    it('should fetch with total loaded count as page size', () => {
      let call = 0;
      const fetchSpy = jasmine.createSpy('fetch').and.callFake(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : call === 2 ? [ 4, 5, 6 ] : [ 10, 20, 30, 40, 50, 60 ]);
      });
      const { pager } = createPager(fetchSpy);
      collectStates(pager.list$);
      pager.load();
      pager.load();
      pager.refresh();
      expect(fetchSpy.calls.mostRecent().args[0]).toBe(6);
    });

    it('should cap refresh page size to maxPageSize', () => {
      let call = 0;
      const fetchSpy = jasmine.createSpy('fetch').and.callFake(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : call === 2 ? [ 4, 5, 6 ] : [ 10, 20, 30, 40 ]);
      });
      const { pager } = createPager(fetchSpy, { pageSize: 3, maxPageSize: 4 });
      collectStates(pager.list$);
      pager.load();
      pager.load();
      pager.refresh();
      expect(fetchSpy.calls.mostRecent().args[0]).toBe(4);
    });

    it('should use at least default pageSize for refresh when fewer items loaded', () => {
      const fetchSpy = jasmine.createSpy('fetch').and.callFake(
        () => of([ 1, 2 ]),
      );
      const { pager } = createPager(fetchSpy, { pageSize: 5 });
      collectStates(pager.list$);
      pager.load();
      pager.refresh();
      expect(fetchSpy.calls.mostRecent().args[0]).toBe(5);
    });

    it('should set canLoadMore correctly after refresh with full result', () => {
      let call = 0;
      const { pager } = createPager(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : [ 10, 20, 30 ]);
      });
      let canLoadMore: boolean | undefined;
      pager.canLoadMore$.subscribe(v => canLoadMore = v);
      pager.load();
      pager.refresh();
      expect(canLoadMore).toBeTrue();
    });

    it('should set canLoadMore to false after refresh with fewer results than requested', () => {
      let call = 0;
      const { pager } = createPager(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : [ 10 ]);
      });
      let canLoadMore: boolean | undefined;
      pager.canLoadMore$.subscribe(v => canLoadMore = v);
      pager.load();
      pager.refresh();
      expect(canLoadMore).toBeFalse();
    });

    it('should emit error state on refresh failure', () => {
      let call = 0;
      const { pager, onLoadMoreError } = createPager(() => {
        call++;
        if (call === 1) return of([ 1, 2, 3 ]);
        return throwError(() => new Error('refresh failed'));
      });
      const states = collectStates(pager.list$);
      pager.load();
      pager.refresh();
      const lastState = states[states.length - 1]!;
      expect(lastState.isError).toBeTrue();
      expect(onLoadMoreError).not.toHaveBeenCalled();
    });

    it('should work when refreshing with no data loaded', () => {
      const { pager } = createPager(() => of([ 1, 2, 3 ]));
      const states = collectStates(pager.list$);
      pager.refresh();
      const lastState = states[states.length - 1]!;
      expect(lastState.isReady).toBeTrue();
      expect(lastState.data).toEqual([ 1, 2, 3 ]);
    });
  });

  describe('setPageSize', () => {
    it('should use the new page size for subsequent loads', () => {
      const fetchSpy = jasmine.createSpy('fetch').and.returnValue(of([ 1 ]));
      const { pager } = createPager(fetchSpy, { pageSize: 3 });
      collectStates(pager.list$);
      pager.load();
      pager.setPageSize(10);
      pager.reset();
      expect(fetchSpy.calls.mostRecent().args[0]).toBe(10);
    });

    it('should use the new maxPageSize for refresh', () => {
      let call = 0;
      const fetchSpy = jasmine.createSpy('fetch').and.callFake(() => {
        call++;
        return of(call === 1 ? [ 1, 2, 3 ] : call === 2 ? [ 4, 5, 6 ] : [ 10, 20, 30, 40, 50 ]);
      });
      const { pager } = createPager(fetchSpy, { pageSize: 3, maxPageSize: 100 });
      collectStates(pager.list$);
      pager.load();
      pager.load();
      pager.setPageSize(3, 5);
      pager.refresh();
      expect(fetchSpy.calls.mostRecent().args[0]).toBe(5);
    });
  });
});
