import { TestBed } from '@angular/core/testing';
import { concat, EMPTY, Observable, of, Subject, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { APPCONFIG } from 'src/app/config';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { FullItemRoute, itemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { LocaleService } from 'src/app/services/localeService';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { fetchingState, readyState } from 'src/app/utils/state';
import { ItemTaskFlowService } from './item-task-flow.service';
import { ItemData } from './models/item-data';
import { InitialAnswerDataSource } from './services/initial-answer-datasource';
import { fromItemContent } from './store';

const mockItemBase: Item = {
  id: '1',
  requiresExplicitEntry: false,
  string: { title: 'Test', description: null, imageUrl: null, subtitle: null, languageTag: 'en' },
  bestScore: 0,
  permissions: {
    canView: ItemViewPerm.Content,
    canGrantView: ItemGrantViewPerm.None,
    canEdit: ItemEditPerm.None,
    canWatch: ItemWatchPerm.None,
    isOwner: false,
    canRequestHelp: false,
    enteringTimeIntervals: [],
  },
  type: 'Task',
  displaySettings: displaySettingsSchema.parse({}),
  textId: null,
  validationType: 'None',
  noScore: false,
  allowsMultipleAttempts: false,
  duration: null,
  enteringTimeMin: new Date(),
  enteringTimeMax: new Date(),
  entryParticipantType: 'User',
  entryFrozenTeams: false,
  entryMaxTeamSize: 0,
  entryMinAdmittedMembersRatio: 'None',
  url: 'http://example.com/task',
  usesApi: false,
  defaultLanguageTag: 'en',
  supportedLanguageTags: [ 'en' ],
};

function createItemData(route: FullItemRoute): ItemData {
  return {
    route,
    item: { ...mockItemBase, id: route.id },
    breadcrumbs: [],
  };
}

function configureFlowService(
  route: FullItemRoute,
  initialAnswer: { answer$: Observable<unknown>, error$: Observable<unknown>, setInfo: jasmine.Spy } = {
    answer$: of(null),
    error$: of(undefined),
    setInfo: jasmine.createSpy('setInfo'),
  },
): void {
  TestBed.configureTestingModule({
    providers: [
      ItemTaskFlowService,
      provideMockStore({
        selectors: [
          { selector: fromItemContent.selectActiveContentRoute, value: route },
          { selector: fromItemContent.selectActiveContentRouteErrorHandlingState, value: null },
          { selector: fromItemContent.selectActiveContentData, value: readyState(createItemData(route)) },
        ],
      }),
      { provide: InitialAnswerDataSource, useValue: initialAnswer },
      { provide: LocaleService, useValue: { currentLang: { tag: 'en', path: '/en' } } },
      { provide: ConfirmationModalService, useValue: { open: (): typeof EMPTY => EMPTY } },
      { provide: ItemRouter, useValue: { navigateTo: jasmine.createSpy('navigateTo') } },
      { provide: APPCONFIG, useValue: { redirects: [] } },
    ],
  });
}

describe('ItemTaskFlowService', () => {
  let store: MockStore;
  let setInfo: jasmine.Spy;

  const route1 = itemRoute('activity', '1', { attemptId: '0', path: [] });
  const route2 = itemRoute('activity', '2', { attemptId: '0', path: [] });

  beforeEach(() => {
    setInfo = jasmine.createSpy('setInfo');
    configureFlowService(route1, { setInfo, error$: EMPTY, answer$: EMPTY });
    store = TestBed.inject(MockStore);
    TestBed.inject(ItemTaskFlowService);
  });

  afterEach(() => {
    TestBed.inject(ItemTaskFlowService).ngOnDestroy();
  });

  it('calls setInfo exactly once on init', () => {
    TestBed.flushEffects();

    expect(setInfo).toHaveBeenCalledTimes(1);
    expect(setInfo).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: '1' }),
      true,
    );
  });

  it('calls setInfo once when route and item data change', () => {
    TestBed.flushEffects();
    setInfo.calls.reset();

    store.overrideSelector(fromItemContent.selectActiveContentRoute, route2);
    store.overrideSelector(fromItemContent.selectActiveContentData, readyState(createItemData(route2)));
    store.refreshState();
    TestBed.flushEffects();

    expect(setInfo).toHaveBeenCalledTimes(1);
    expect(setInfo).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: '2' }),
      true,
    );
  });
});

describe('ItemTaskFlowService – before-unload save then teardown', () => {
  let service: ItemTaskFlowService;
  let saveStarted = 0;
  let teardownStarted = 0;
  const callOrder: string[] = [];

  const route = itemRoute('activity', '1', { attemptId: '0', path: [] });

  // Injected per test (not in beforeEach) so a test can spy on window listeners before the constructor runs.
  function createService(): void {
    service = TestBed.inject(ItemTaskFlowService);
    service.registerSaveHandler(() => {
      saveStarted += 1;
      callOrder.push('save');
      return concat(
        of(fetchingState<void>(undefined)),
        timer(5000).pipe(map(() => readyState(undefined))),
      );
    });
    service.registerTeardownHandler(() => {
      teardownStarted += 1;
      callOrder.push('teardown');
      return of(undefined);
    });
  }

  beforeEach(() => {
    saveStarted = 0;
    teardownStarted = 0;
    callOrder.length = 0;
    configureFlowService(route);
  });

  afterEach(() => {
    service.ngOnDestroy();
    // Destroy the injector so takeUntilDestroyed() drops the window beforeunload listener.
    TestBed.resetTestingModule();
  });

  it('does not cancel an in-flight before-unload save when a second trigger fires', () => {
    createService();
    jasmine.clock().install();
    try {
      let beforeUnloadDone: boolean | undefined;
      service.beforeUnload().subscribe(done => {
        beforeUnloadDone = done;
      });

      jasmine.clock().tick(0);
      expect(saveStarted).toBe(1);
      expect(beforeUnloadDone).toBeUndefined();

      service.retryBeforeUnload();
      jasmine.clock().tick(1000);
      expect(saveStarted).toBe(1);
      expect(beforeUnloadDone).toBeUndefined();

      jasmine.clock().tick(4000);
      expect(saveStarted).toBe(1);
      expect(teardownStarted).toBe(1);
      expect(callOrder).toEqual([ 'save', 'teardown' ]);
      expect(beforeUnloadDone).toBe(true);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('runs teardown after skipBeforeUnload', () => {
    createService();
    jasmine.clock().install();
    try {
      let beforeUnloadDone: boolean | undefined;
      service.beforeUnload().subscribe(done => {
        beforeUnloadDone = done;
      });
      jasmine.clock().tick(0);
      expect(saveStarted).toBe(1);
      expect(beforeUnloadDone).toBeUndefined();

      service.skipBeforeUnload();
      jasmine.clock().tick(0);

      expect(teardownStarted).toBe(1);
      expect(callOrder).toEqual([ 'save', 'teardown' ]);
      expect(beforeUnloadDone).toBe(true);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('starts save and teardown in the same turn on window beforeunload', () => {
    // Karma treats a real window beforeunload as a full page reload, so capture the listener
    // fromEvent registers and invoke it with a synthetic Event (same path as dispatch).
    const beforeUnloadListeners = new Set<EventListenerOrEventListenerObject>();
    const realAdd = globalThis.addEventListener.bind(globalThis);
    const realRemove = globalThis.removeEventListener.bind(globalThis);
    spyOn(globalThis, 'addEventListener').and.callFake(
      (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === 'beforeunload') {
          beforeUnloadListeners.add(listener);
          return;
        }
        realAdd(type, listener, options);
      },
    );
    spyOn(globalThis, 'removeEventListener').and.callFake(
      (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        if (type === 'beforeunload') {
          beforeUnloadListeners.delete(listener);
          return;
        }
        realRemove(type, listener, options);
      },
    );
    createService();

    // Save is still fetching (timer 5000); do not tick the clock — teardown must start in the same turn.
    expect(beforeUnloadListeners.size).toBe(1);
    const event = new Event('beforeunload');
    beforeUnloadListeners.forEach(listener => (typeof listener === 'function' ? listener(event) : listener.handleEvent(event)));

    expect(callOrder).toEqual([ 'save', 'teardown' ]);
    expect(saveStarted).toBe(1);
    expect(teardownStarted).toBe(1);
  });
});

describe('ItemTaskFlowService – sticky item→item teardown', () => {
  let service: ItemTaskFlowService;
  let store: MockStore;
  let teardownRelease$: Subject<void>;
  let teardownCalls = 0;

  const route1 = itemRoute('activity', '1', { attemptId: '0', path: [] });
  const route2 = itemRoute('activity', '2', { attemptId: '0', path: [] });
  const itemData2 = createItemData(route2);

  beforeEach(() => {
    teardownCalls = 0;
    teardownRelease$ = new Subject<void>();
    configureFlowService(route1);
    store = TestBed.inject(MockStore);
    service = TestBed.inject(ItemTaskFlowService);
    service.registerTeardownHandler(() => {
      teardownCalls += 1;
      return teardownRelease$.pipe(map(() => undefined));
    });
    TestBed.flushEffects();
  });

  afterEach(() => {
    teardownRelease$.complete();
    service.ngOnDestroy();
  });

  it('keeps sticky item data until awaited teardown completes', () => {
    store.overrideSelector(fromItemContent.selectActiveContentRoute, route2);
    store.overrideSelector(fromItemContent.selectActiveContentData, fetchingState());
    store.refreshState();
    TestBed.flushEffects();

    expect(service.isTearingDownTask()).toBeTrue();
    expect(service.stickyItemData()?.item.id).toBe('1');
    expect(teardownCalls).toBe(1);

    teardownRelease$.next();
    teardownRelease$.complete();
    TestBed.flushEffects();

    expect(service.isTearingDownTask()).toBeFalse();
    expect(service.stickyItemData()).toBeNull();
  });

  it('awaits teardown before clearing sticky when next item is already ready', () => {
    store.overrideSelector(fromItemContent.selectActiveContentRoute, route2);
    store.overrideSelector(fromItemContent.selectActiveContentData, readyState(itemData2));
    store.refreshState();
    TestBed.flushEffects();

    expect(service.isTearingDownTask()).toBeTrue();
    expect(service.stickyItemData()?.item.id).toBe('1');
    expect(teardownCalls).toBe(1);

    teardownRelease$.next();
    teardownRelease$.complete();
    TestBed.flushEffects();

    expect(service.isTearingDownTask()).toBeFalse();
    expect(service.stickyItemData()).toBeNull();
  });
});
