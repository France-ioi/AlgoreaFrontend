import { Store } from '@ngrx/store';
import { EMPTY, toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { fromItemContent } from './item-content.store';
import { breadcrumbsFetchingEffect, itemFetchingEffect, resultsFetchingEffect } from './item-fetching.effects';
import { BreadcrumbItem } from '../../data-access/get-breadcrumb.service';
import { ItemBreadcrumbsWithFailoverService } from '../../services/item-breadcrumbs-with-failover.service';
import { FullItemRoute, itemRoute } from 'src/app/models/routing/item-route';
import { Result } from '../../models/attempts';
import { ResultFetchingService } from '../../services/result-fetching.service';
import { UserSessionService } from 'src/app/services/user-session.service';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});
const route: FullItemRoute = itemRoute('activity', '1', { attemptId: '0', path: [] });
const userSessionServiceMock = { userChanged$: EMPTY, userProfile$: EMPTY } as unknown as UserSessionService;

describe('itemFetchingEffect', () => {
  const mockItem = 'mockItem' as unknown as Item;

  it('does not refetch if we come back to the same item after a non-item page', done => {
    const getItemServiceSpy = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);
    testScheduler.run(({ hot, cold }) => {
      getItemServiceSpy.get.and.callFake(() => cold('-a|', { a: mockItem }));
      const selectActiveContentRoute$ = hot('a-x-a--|', { a: route, x: null });
      const actions$ = hot('                 -------|');
      const storeMock$ = {
        select: () => selectActiveContentRoute$
      } as unknown as Store;

      itemFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        getItemServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions.length).toEqual(2);
          expect(actions[0]?.fetchState.isFetching).toBeTrue();
          expect(actions[1]?.fetchState.isReady).toBeTrue();
          expect(actions[1]?.fetchState.data).toEqual(mockItem);
          expect(getItemServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  it('does refetch item with observation change', done => {
    const getItemServiceSpy = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);
    testScheduler.run(({ hot, cold }) => {
      const itemObservingG = { ...route, observedGroup: { id: '1' } };
      const itemNotObservingG = route;
      const itemObservingG2 = { ...route, observedGroup: { id: '2' } };
      getItemServiceSpy.get.and.callFake(() => cold('-a|', { a: mockItem }));
      const selectActiveContentRoute$ = hot('a-x-k-b-|', { a: itemObservingG, x: null, k: itemNotObservingG, b: itemObservingG2 });
      const actions$ = hot('                 --------|');
      const storeMock$ = {
        select: () => selectActiveContentRoute$
      } as unknown as Store;

      itemFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        getItemServiceSpy
      ).pipe(toArray()).subscribe({
        next: () => {
          expect(getItemServiceSpy.get).toHaveBeenCalledTimes(3);
          done();
        }
      });
    });
  });

  it('refetches on refresh', done => {
    const getItemServiceSpy = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);
    testScheduler.run(({ hot, cold }) => {
      getItemServiceSpy.get.and.callFake(() => cold('-a|', { a: mockItem }));
      const selectActiveContentRoute$ = hot('a-----|', { a: route });
      const actions$ = hot('                 --r---|', { r: fromItemContent.itemByIdPageActions.refresh() });
      const storeMock$ = {
        select: () => selectActiveContentRoute$
      } as unknown as Store;

      itemFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        getItemServiceSpy
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions[0]?.fetchState.isFetching).toBeTrue();
          expect(actions[1]?.fetchState.isReady).toBeTrue();
          expect(actions[2]?.fetchState.isFetching).toBeTrue();
          expect(actions[3]?.fetchState.isReady).toBeTrue();
          done();
        }
      });
    });
  });

});

describe('breadcrumbsFetchingEffect', () => {
  const mockBreadcrumbs = 'mockBreadcrumbs' as unknown as BreadcrumbItem[];

  it('does not refetch if we come back to the same item after a non-item page', done => {
    const breadcrumbsServiceSpy = jasmine.createSpyObj<ItemBreadcrumbsWithFailoverService>('ItemBreadcrumbsWithFailoverService', [ 'get' ]);
    testScheduler.run(({ hot, cold }) => {
      breadcrumbsServiceSpy.get.and.callFake(() => cold('-a|', { a: mockBreadcrumbs }));
      const selectActiveRoute$ = hot('a-x-a----|', { x: null, a: route });
      const actions$ = hot('          ---------|');
      const storeMock$ = {
        select: () => selectActiveRoute$,
      } as unknown as Store;

      breadcrumbsFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        breadcrumbsServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions.length).toEqual(2);
          expect(actions[0]?.fetchState.isFetching).toBeTrue();
          expect(actions[1]?.fetchState.isReady).toBeTrue();
          expect(actions[1]?.fetchState.data).toEqual(mockBreadcrumbs);
          expect(breadcrumbsServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  it('refetches on refresh', done => {
    const breadcrumbsServiceSpy = jasmine.createSpyObj<ItemBreadcrumbsWithFailoverService>('ItemBreadcrumbsWithFailoverService', [ 'get' ]);
    testScheduler.run(({ hot, cold }) => {
      breadcrumbsServiceSpy.get.and.callFake(() => cold('-a|', { a: mockBreadcrumbs }));
      const selectActiveRoute$ = hot('a-x-a----|', { x: null, a: route });
      const actions$ = hot('          --r---|', { r: fromItemContent.itemByIdPageActions.refresh() });
      const storeMock$ = {
        select: () => selectActiveRoute$,
      } as unknown as Store;

      breadcrumbsFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        breadcrumbsServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions[0]?.fetchState.isFetching).toBeTrue();
          expect(actions[1]?.fetchState.isReady).toBeTrue();
          expect(actions[2]?.fetchState.isFetching).toBeTrue();
          expect(actions[3]?.fetchState.isReady).toBeTrue();
          done();
        }
      });
    });
  });

});

describe('resultsFetchingEffect', () => {
  const mockItem = { permissions: { canView: 'content' } } as unknown as Item;
  const mockResults = {} as unknown as { results: Result[], currentResult?: Result };

  it('fetches when required info is ready, do not refetch while the route does not change', done => {
    const resultsServiceSpy = jasmine.createSpyObj<ResultFetchingService>('ResultFetchingService', [ 'fetchResults' ]);
    testScheduler.run(({ hot, cold }) => {
      resultsServiceSpy.fetchResults.and.callFake(() => cold('-a|', { a: mockResults }));
      const selectInfo$ = hot('x-r-x-r-|', { x: null, r: { route, item: mockItem } });
      const actions$ = hot('   --------|');
      const storeMock$ = {
        select: () => selectInfo$
      } as unknown as Store;

      resultsFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        resultsServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(resultsServiceSpy.fetchResults).toHaveBeenCalledTimes(1);
          expect(actions.length).toEqual(2);
          expect(actions[0]?.fetchState!.isFetching).toBeTrue();
          expect(actions[1]?.fetchState!.isReady).toBeTrue();
          done();
        }
      });
    });
  });

  it('does refetch on route change', done => {
    const resultsServiceSpy = jasmine.createSpyObj<ResultFetchingService>('ResultFetchingService', [ 'fetchResults' ]);
    const anotherRoute: FullItemRoute = itemRoute('activity', '2', { attemptId: '0', path: [] });
    testScheduler.run(({ hot, cold }) => {
      resultsServiceSpy.fetchResults.and.callFake(() => cold('-a|', { a: mockResults }));
      const selectInfo$ = hot('r-s-|', { r: { route, item: mockItem }, s: { route: anotherRoute, item: mockItem } });
      const actions$ = hot('   ----|');
      const storeMock$ = {
        select: () => selectInfo$
      } as unknown as Store;

      resultsFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        resultsServiceSpy,
      ).pipe(toArray()).subscribe({
        next: () => {
          expect(resultsServiceSpy.fetchResults).toHaveBeenCalledTimes(2);
          done();
        }
      });
    });
  });

  it('does refetch on view perm change', done => {
    const mockItemWithInfoPerm = { permissions: { canView: 'info' } } as unknown as Item;

    const resultsServiceSpy = jasmine.createSpyObj<ResultFetchingService>('ResultFetchingService', [ 'fetchResults' ]);
    testScheduler.run(({ hot, cold }) => {
      resultsServiceSpy.fetchResults.and.callFake(() => cold('-a|', { a: mockResults }));
      const selectInfo$ = hot('r-s-|', { r: { route, item: mockItemWithInfoPerm }, s: { route: route, item: mockItem } });
      const actions$ = hot('   ----|');
      const storeMock$ = {
        select: () => selectInfo$
      } as unknown as Store;

      resultsFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        resultsServiceSpy,
      ).pipe(toArray()).subscribe({
        next: () => {
          expect(resultsServiceSpy.fetchResults).toHaveBeenCalledTimes(2);
          done();
        }
      });
    });
  });

  it('refetches on refresh', done => {
    const resultsServiceSpy = jasmine.createSpyObj<ResultFetchingService>('ResultFetchingService', [ 'fetchResults' ]);
    testScheduler.run(({ hot, cold }) => {
      resultsServiceSpy.fetchResults.and.callFake(() => cold('-a|', { a: mockResults }));
      const selectInfo$ = hot('r---|', { r: { route, item: mockItem } });
      const actions$ = hot('   --r-|', { r: fromItemContent.itemByIdPageActions.refresh() });
      const storeMock$ = {
        select: () => selectInfo$
      } as unknown as Store;

      resultsFetchingEffect(
        storeMock$,
        actions$,
        userSessionServiceMock,
        resultsServiceSpy,
      ).pipe(toArray()).subscribe({
        next: actions => {
          expect(actions.length).toEqual(4);
          expect(actions[0]?.fetchState!.isFetching).toBeTrue();
          expect(actions[1]?.fetchState!.isReady).toBeTrue();
          expect(actions[2]?.fetchState!.isFetching).toBeTrue();
          expect(actions[3]?.fetchState!.isReady).toBeTrue();
          done();
        }
      });
    });
  });

});
