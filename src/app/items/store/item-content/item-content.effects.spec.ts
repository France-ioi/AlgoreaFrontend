import { TestBed } from '@angular/core/testing';
import { Action, Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, toArray } from 'rxjs';
import {
  dispatchCurrentContentEffect,
  ensureAttemptInUrlEffect,
} from './item-content.effects';
import { attemptResolution } from './attempt-resolution';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { displaySettingsSchema } from '../../models/display-settings';
import { ItemViewPerm } from '../../models/item-view-permission';
import { FullItemRoute, itemRoute, resultsFetchKey } from 'src/app/models/routing/item-route';
import { TestScheduler } from 'rxjs/testing';
import { fetchingState, readyState, errorState } from 'src/app/utils/state';
import { Result } from '../../models/attempts';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { Item } from './item-content.state';
import { itemFetchingActions } from './item-content.actions';

describe('dispatchCurrentContentEffect', () => {
  let store: MockStore<object>;
  let currentContent$: Subject<{
    route: { id: string, path: string[], contentType: 'activity', attemptId: string },
    breadcrumbs: {
      itemId: string,
      title: string,
      route: { id: string, path: string[], contentType: 'activity', attemptId: string },
    }[],
    item: {
      string: { title: string },
      type: 'Task',
      requiresExplicitEntry: boolean,
      permissions: { canView: ItemViewPerm, canRequestHelp: boolean },
      displaySettings: ReturnType<typeof displaySettingsSchema.parse>,
    },
  } | null>;

  beforeEach(() => {
    currentContent$ = new Subject();

    TestBed.configureTestingModule({
      providers: [
        provideMockStore(),
        { provide: ItemRouter, useValue: { navigateTo: jasmine.createSpy('navigateTo') } },
      ],
    });

    store = TestBed.inject(MockStore) as MockStore<object>;
    spyOn(store, 'select').and.returnValue(currentContent$.asObservable());
  });

  it('should dispatch breadcrumbs with a resolved icon on the last element', done => {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => dispatchCurrentContentEffect()).pipe(toArray()).subscribe({
      next: actions => {
        emitted.push(...actions);
        const action = emitted[0] as ReturnType<typeof fromCurrentContent.contentPageActions.changeContent>;
        expect(action.breadcrumbs?.[0]!.icon).toBeUndefined();
        expect(action.breadcrumbs?.[1]!.icon).toBe('ph-file-text');
        done();
      },
    });

    currentContent$.next({
      route: { id: 'task-1', path: [ 'chapter-1' ], contentType: 'activity', attemptId: '0' },
      breadcrumbs: [
        {
          itemId: 'chapter-1',
          title: 'Chapter',
          route: { id: 'chapter-1', path: [], contentType: 'activity', attemptId: '0' },
        },
        {
          itemId: 'task-1',
          title: 'Task',
          route: { id: 'task-1', path: [ 'chapter-1' ], contentType: 'activity', attemptId: '0' },
        },
      ],
      item: {
        string: { title: 'Task' },
        type: 'Task',
        requiresExplicitEntry: false,
        permissions: { canView: ItemViewPerm.Content, canRequestHelp: false },
        displaySettings: displaySettingsSchema.parse({}),
      },
    });
    currentContent$.complete();
  });
});

describe('attemptResolution', () => {
  const parentOnlyRoute: FullItemRoute = itemRoute('activity', '1', { path: [], parentAttemptId: '0' });
  const resolvedRoute: FullItemRoute = itemRoute('activity', '1', {
    path: [],
    parentAttemptId: '0',
    attemptId: '42',
  });
  const key = resultsFetchKey(parentOnlyRoute);
  const contentItem = {
    requiresExplicitEntry: false,
    permissions: { canView: ItemViewPerm.Content },
  } as Item;
  const infoOnlyItem = {
    requiresExplicitEntry: false,
    permissions: { canView: ItemViewPerm.Info },
  } as Item;
  const explicitItem = {
    requiresExplicitEntry: true,
    permissions: { canView: ItemViewPerm.Content },
  } as Item;
  const started: Result = {
    attemptId: '42',
    latestActivityAt: new Date('2020-01-02'),
    startedAt: new Date('2020-01-01'),
    score: 0,
    validated: false,
    allowsSubmissionsUntil: new Date('2099-01-01'),
  };

  it('returns pick when URL has no attempt and a best attempt exists', () => {
    const resultsState = readyState([ started ], key);
    expect(attemptResolution(parentOnlyRoute, contentItem, resultsState)).toEqual({
      kind: 'pick',
      attemptId: '42',
    });
  });

  it('returns start when no suitable attempt and implicit start is allowed', () => {
    const resultsState = readyState<Result[], typeof key>([], key);
    expect(attemptResolution(parentOnlyRoute, contentItem, resultsState)).toEqual({ kind: 'start' });
  });

  it('returns null when the URL already names an attempt', () => {
    const resultsState = readyState([ started ], key);
    expect(attemptResolution(resolvedRoute, contentItem, resultsState)).toBeNull();
  });

  it('returns null when the user cannot view content', () => {
    const resultsState = readyState([ started ], key);
    expect(attemptResolution(parentOnlyRoute, infoOnlyItem, resultsState)).toBeNull();
  });

  it('returns null when explicit entry is required and there is no attempt', () => {
    const resultsState = readyState<Result[], typeof key>([], key);
    expect(attemptResolution(parentOnlyRoute, explicitItem, resultsState)).toBeNull();
  });

  it('returns null while results are still fetching', () => {
    const resultsState = fetchingState<Result[], typeof key>(undefined, key);
    expect(attemptResolution(parentOnlyRoute, contentItem, resultsState)).toBeNull();
  });

  it('returns null when results are in error (stops re-triggering start)', () => {
    const resultsState = errorState<typeof key>(new Error('start failed'), key);
    expect(attemptResolution(parentOnlyRoute, contentItem, resultsState)).toBeNull();
  });
});

describe('ensureAttemptInUrlEffect', () => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  it('navigates once with replaceUrl on pick', done => {
    const itemRouterSpy = jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]);
    const resultActionsSpy = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'start' ]);
    const parentOnlyRoute: FullItemRoute = itemRoute('activity', '1', { path: [], parentAttemptId: '0' });
    const normalizedRoute = itemRoute('activity', '1', { path: [], parentAttemptId: '0', attemptId: '42' });

    testScheduler.run(({ hot }) => {
      const selectCtx$ = hot('a---|', {
        a: { route: parentOnlyRoute, resolution: { kind: 'pick' as const, attemptId: '42' } },
      });
      const storeMock$ = {
        select: () => selectCtx$,
        dispatch: jasmine.createSpy('dispatch'),
      } as unknown as Store;

      ensureAttemptInUrlEffect(storeMock$, itemRouterSpy, resultActionsSpy).subscribe({
        complete: () => {
          expect(itemRouterSpy.navigateTo).toHaveBeenCalledOnceWith(normalizedRoute, {
            navExtras: { replaceUrl: true },
            loadAnswerIdAsCurrent: undefined,
          });
          expect(resultActionsSpy.start).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('does not navigate when there is nothing to resolve', done => {
    const itemRouterSpy = jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]);
    const resultActionsSpy = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'start' ]);

    testScheduler.run(({ hot }) => {
      const selectCtx$ = hot('n---|', { n: null });
      const storeMock$ = {
        select: () => selectCtx$,
        dispatch: jasmine.createSpy('dispatch'),
      } as unknown as Store;

      ensureAttemptInUrlEffect(storeMock$, itemRouterSpy, resultActionsSpy).subscribe({
        complete: () => {
          expect(itemRouterSpy.navigateTo).not.toHaveBeenCalled();
          expect(resultActionsSpy.start).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('starts a result then navigates on start', done => {
    const itemRouterSpy = jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]);
    const startedResult: Result = {
      attemptId: '77',
      latestActivityAt: new Date(),
      startedAt: new Date(),
      score: 0,
      validated: false,
      allowsSubmissionsUntil: new Date('2099-01-01'),
    };
    const resultActionsSpy = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'start' ]);
    const parentOnlyRoute: FullItemRoute = itemRoute('activity', '1', { path: [ 'p' ], parentAttemptId: '0' });

    testScheduler.run(({ hot, cold }) => {
      resultActionsSpy.start.and.returnValue(cold('--a|', { a: startedResult }));
      const selectCtx$ = hot('a------|', {
        a: { route: parentOnlyRoute, resolution: { kind: 'start' as const } },
      });
      const dispatch = jasmine.createSpy('dispatch');
      const storeMock$ = {
        select: () => selectCtx$,
        dispatch,
      } as unknown as Store;

      ensureAttemptInUrlEffect(storeMock$, itemRouterSpy, resultActionsSpy).subscribe({
        complete: () => {
          expect(resultActionsSpy.start).toHaveBeenCalledOnceWith([ 'p', '1' ], '0');
          expect(dispatch).toHaveBeenCalled();
          expect(itemRouterSpy.navigateTo).toHaveBeenCalledOnceWith(
            itemRoute('activity', '1', { path: [ 'p' ], parentAttemptId: '0', attemptId: '77' }),
            { navExtras: { replaceUrl: true }, loadAnswerIdAsCurrent: undefined },
          );
          done();
        },
      });
    });
  });

  it('on start failure dispatches results errorState, does not navigate, and does not error the effect', done => {
    const itemRouterSpy = jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]);
    const resultActionsSpy = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'start' ]);
    const parentOnlyRoute: FullItemRoute = itemRoute('activity', '1', { path: [ 'p' ], parentAttemptId: '0' });
    const startError = new Error('start failed');

    testScheduler.run(({ hot, cold }) => {
      resultActionsSpy.start.and.returnValue(cold('--#', {}, startError));
      // One emission: catchError must keep the effect alive (no throw) and surface errorState once.
      // A real store then makes selectAttemptResolution null, so start is not re-triggered.
      const selectCtx$ = hot('a---|', {
        a: { route: parentOnlyRoute, resolution: { kind: 'start' as const } },
      });
      const dispatch = jasmine.createSpy('dispatch');
      const storeMock$ = {
        select: () => selectCtx$,
        dispatch,
      } as unknown as Store;

      ensureAttemptInUrlEffect(storeMock$, itemRouterSpy, resultActionsSpy).subscribe({
        error: () => fail('effect must not error on start failure'),
        complete: () => {
          expect(resultActionsSpy.start).toHaveBeenCalledTimes(1);
          expect(dispatch).toHaveBeenCalledOnceWith(
            itemFetchingActions.resultsFetchStateChanged({
              fetchState: errorState(startError, resultsFetchKey(parentOnlyRoute)),
            }),
          );
          expect(itemRouterSpy.navigateTo).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
