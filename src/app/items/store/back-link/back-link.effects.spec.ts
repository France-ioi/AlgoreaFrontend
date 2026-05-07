import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { routerNavigatedAction } from '@ngrx/router-store';
import { Subject, toArray } from 'rxjs';
import { backLinkActions, sourcePageActions } from './back-link.actions';
import { clearBackLinkEffect } from './back-link.effects';
import { itemContentStore } from '../item-content/item-content.store';
import { ItemContentIdentifier } from 'src/app/models/routing/item-route';

const dummyRouterNavigated: ReturnType<typeof routerNavigatedAction> = routerNavigatedAction({
  // Cast through unknown: the payload shape is irrelevant for the effect logic
  // (we only care about the action's identity via `ofType`).
  payload: {} as never,
});

const registerBackLink = sourcePageActions.registerBackLink({
  backLink: { url: '/source', label: 'Back' },
});

describe('clearBackLinkEffect', () => {
  let actions$: Subject<Action>;
  let store: MockStore<object>;
  let activeContentIdentifier$: Subject<ItemContentIdentifier | null>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    activeContentIdentifier$ = new Subject<ItemContentIdentifier | null>();

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore(),
      ],
    });

    store = TestBed.inject(MockStore) as MockStore<object>;
    // Override the source-of-truth for the active-content identifier with a
    // Subject we drive from the test, instead of relying on the real selector.
    spyOn(store, 'select').and.callFake((selector: unknown) => {
      if (selector === itemContentStore.selectActiveContentIdentifier) return activeContentIdentifier$.asObservable();
      throw new Error('Unexpected selector in clearBackLinkEffect test');
    });
  });

  it('clears when the active item changes after the destination has loaded', done => {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => clearBackLinkEffect()).pipe(toArray()).subscribe({
      next: actions => {
        emitted.push(...actions);
        expect(emitted).toEqual([ backLinkActions.clear() ]);
        done();
      },
    });

    actions$.next(registerBackLink);
    actions$.next(dummyRouterNavigated);
    activeContentIdentifier$.next({ id: 'destination-item' });
    activeContentIdentifier$.next({ id: 'next-item' });
    actions$.complete();
    activeContentIdentifier$.complete();
  });

  it('clears when only the observed-group id changes (same item)', done => {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => clearBackLinkEffect()).pipe(toArray()).subscribe({
      next: actions => {
        emitted.push(...actions);
        expect(emitted).toEqual([ backLinkActions.clear() ]);
        done();
      },
    });

    actions$.next(registerBackLink);
    actions$.next(dummyRouterNavigated);
    activeContentIdentifier$.next({ id: 'destination-item', observedGroupId: 'g1' });
    activeContentIdentifier$.next({ id: 'destination-item', observedGroupId: 'g2' });
    actions$.complete();
    activeContentIdentifier$.complete();
  });

  // Note: dedup of intra-content URL changes (same id and observed-group) is the
  // selector's responsibility — `selectActiveContentIdentifier` is composed from
  // primitive-returning selectors so its output reference is stable when neither
  // id changes, and `Store.select` only emits on actual value changes.

  it('does not clear before the first router navigation has occurred', done => {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => clearBackLinkEffect()).pipe(toArray()).subscribe({
      next: actions => {
        emitted.push(...actions);
        // Without the routerNavigatedAction gate, the destination's identifier
        // would arrive immediately after registration and trigger an instant clear.
        expect(emitted).toEqual([]);
        done();
      },
    });

    actions$.next(registerBackLink);
    activeContentIdentifier$.next({ id: 'destination-item' });
    activeContentIdentifier$.next({ id: 'next-item' });
    actions$.complete();
    activeContentIdentifier$.complete();
  });

  it('re-registering during the watch window restarts the count via switchMap', done => {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => clearBackLinkEffect()).pipe(toArray()).subscribe({
      next: actions => {
        emitted.push(...actions);
        expect(emitted.length).toBe(1);
        expect(emitted[0]).toEqual(backLinkActions.clear());
        done();
      },
    });

    actions$.next(registerBackLink);
    actions$.next(dummyRouterNavigated);
    activeContentIdentifier$.next({ id: 'destination-1' });

    actions$.next(registerBackLink);
    activeContentIdentifier$.next({ id: 'destination-2-stale-emission' });
    actions$.next(dummyRouterNavigated);
    activeContentIdentifier$.next({ id: 'destination-2' });
    activeContentIdentifier$.next({ id: 'next-item' });

    actions$.complete();
    activeContentIdentifier$.complete();
  });
});
