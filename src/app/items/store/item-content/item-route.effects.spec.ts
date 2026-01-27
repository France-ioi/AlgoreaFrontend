import { Store } from '@ngrx/store';
import { shareReplay, toArray } from 'rxjs';
import { GetItemPathService } from 'src/app/data-access/get-item-path.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { routeErrorHandlingEffect } from './item-route.effects';
import { UserSessionService } from 'src/app/services/user-session.service';
import { TestScheduler } from 'rxjs/testing';
import { errorState, fetchingState } from 'src/app/utils/state';
import { itemRouteErrorHandlingActions } from './item-content.actions';
import { TestBed } from '@angular/core/testing';
import { provideEffects } from '@ngrx/effects';
import { configEffects } from 'src/app/store/config';

describe('routeParamParsingEffect', () => {
  const mockError = new Error('mock service error');

  const getItemPathServiceSpy = jasmine.createSpyObj<GetItemPathService>('GetItemPathService', [ 'getItemPath' ]);
  getItemPathServiceSpy.getItemPath.and.callFake(() => {
    throw mockError;
  });
  const resultActionsServiceSpy = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'startWithoutAttempt' ]);
  const itemRouterSpy = jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]);
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  const fetchingAction = itemRouteErrorHandlingActions.routeErrorHandlingChange({ newState: fetchingState() });
  const errorAction = itemRouteErrorHandlingActions.routeErrorHandlingChange({ newState: errorState(mockError) });

  beforeEach(() => {
    itemRouterSpy.navigateTo.calls.reset();
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideEffects(
          configEffects,
        ),
      ]
    });
  });

  it('does not emit action when there is no error', done => {
    testScheduler.run(({ hot }) => {
      const selectActiveContentItemParams$ = hot('-x--|', { x: null }).pipe(shareReplay(1));
      const userSessionNoChangeMock$ = { userChanged$: hot('--x-|', { x: null }) } as unknown as UserSessionService;
      const storeMock$ = { select: () => selectActiveContentItemParams$ } as unknown as Store;

      routeErrorHandlingEffect(
        storeMock$,
        userSessionNoChangeMock$,
        getItemPathServiceSpy, // not called
        resultActionsServiceSpy, // not called
        itemRouterSpy
      ).subscribe({
        next: () => fail('should not emit'),
        complete: () => {
          expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(0);
          done();
        }
      });
    });
  });

  it('only emits fetching on error handling success', done => {
    testScheduler.run(({ hot }) => {
      const routeError = { tag: 'error', contentType: 'activity', id: '1', path: [] };
      const selectActiveContentItemParams$ = hot('-x--|', { x: routeError }).pipe(shareReplay(1));
      const userSessionNoChangeMock$ = { userChanged$: hot('----|', { x: null }) } as unknown as UserSessionService;
      const storeMock$ = { select: () => selectActiveContentItemParams$ } as unknown as Store;

      routeErrorHandlingEffect(
        storeMock$,
        userSessionNoChangeMock$,
        getItemPathServiceSpy, // not called in this case (path given)
        resultActionsServiceSpy, // not called in this case (path empty)
        itemRouterSpy
      ).pipe(toArray()).subscribe(events => {
        expect(events).toEqual([ fetchingAction ]);
        expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('restarts the fetching in case of user change during the fetching', done => {
    testScheduler.run(({ hot, cold }) => {
      const routeError = { tag: 'error', contentType: 'activity', id: '1', path: [ 2 ] };
      const selectActiveContentItemParams$ = hot('-x---|', { x: routeError }).pipe(shareReplay(1));
      const userSessionNoChangeMock$ = { userChanged$: hot('--x--|', { x: null }) } as unknown as UserSessionService;
      const storeMock$ = { select: () => selectActiveContentItemParams$ } as unknown as Store;
      resultActionsServiceSpy.startWithoutAttempt.and.callFake(() => cold('--x|', { x: '1' }));

      routeErrorHandlingEffect(
        storeMock$,
        userSessionNoChangeMock$,
        getItemPathServiceSpy, // not called in this case (path given)
        resultActionsServiceSpy,
        itemRouterSpy
      ).pipe(toArray()).subscribe(events => {
        expect(events).toEqual([ fetchingAction, fetchingAction ]);
        expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('emits error on error handling error', done => {
    testScheduler.run(({ hot }) => {
      const routeError = { tag: 'error', contentType: 'activity', id: '1' };
      const selectActiveContentItemParams$ = hot('-x--|', { x: routeError }).pipe(shareReplay(1));
      const userSessionNoChangeMock$ = { userChanged$: hot('----|', { x: null }) } as unknown as UserSessionService;
      const storeMock$ = { select: () => selectActiveContentItemParams$ } as unknown as Store;

      routeErrorHandlingEffect(
        storeMock$,
        userSessionNoChangeMock$,
        getItemPathServiceSpy,
        resultActionsServiceSpy, // not called as getItemPathServiceSpy fails before
        itemRouterSpy
      ).pipe(toArray()).subscribe(events => {
        expect(events).toEqual([ fetchingAction, errorAction ]);
        expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(0);
        done();
      });
    });
  });

  it('retry if the user change', done => {
    testScheduler.run(({ hot }) => {
      const routeError = { tag: 'error', contentType: 'activity', id: '1' };
      const selectActiveContentItemParams$ = hot('-x--|', { x: routeError }).pipe(shareReplay(1));
      const userSessionNoChangeMock$ = { userChanged$: hot('--x-|', { x: null }) } as unknown as UserSessionService;
      const storeMock$ = { select: () => selectActiveContentItemParams$ } as unknown as Store;

      routeErrorHandlingEffect(
        storeMock$,
        userSessionNoChangeMock$,
        getItemPathServiceSpy,
        resultActionsServiceSpy, // not called as getItemPathServiceSpy fails before
        itemRouterSpy
      ).pipe(toArray()).subscribe(events => {
        expect(events).toEqual([ fetchingAction, errorAction, fetchingAction, errorAction ]);
        expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(0);
        done();
      });
    });
  });

});
