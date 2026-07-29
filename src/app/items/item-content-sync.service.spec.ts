import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { FullItemRoute, itemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ContentDisplayType, LayoutService } from 'src/app/services/layout.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { tagError } from 'src/app/utils/errors';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import { breadcrumbServiceTag } from './data-access/get-breadcrumb.service';
import { ItemContentSyncService } from './item-content-sync.service';
import { ItemData } from './models/item-data';
import { ItemTabs } from './item-tabs';
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

function createItemData(route: FullItemRoute, itemOverrides?: Partial<Item>): ItemData {
  return {
    route,
    item: { ...mockItemBase, id: route.id, ...itemOverrides },
    breadcrumbs: [],
  };
}

function taggedBreadcrumbForbiddenError(): HttpErrorResponse {
  return tagError(new HttpErrorResponse({ status: 403 }), breadcrumbServiceTag);
}

describe('ItemContentSyncService', () => {
  let store: MockStore;
  let currentContent: jasmine.SpyObj<Pick<CurrentContentService, 'replace' | 'clear'>>;
  let layoutService: jasmine.SpyObj<Pick<LayoutService, 'configure'>>;
  let itemTabs: jasmine.SpyObj<Pick<ItemTabs, 'itemChanged'>>;
  let itemRouter: jasmine.SpyObj<Pick<ItemRouter, 'navigateTo'>>;

  const route1 = itemRoute('activity', '1', { attemptId: '0', path: [] });
  const route2 = itemRoute('activity', '2', { attemptId: '0', path: [] });
  const routeWithPath = itemRoute('activity', '1', { attemptId: '0', path: [ 'parent' ] });
  const route2WithPath = itemRoute('activity', '2', { attemptId: '0', path: [ 'parent' ] });

  beforeEach(() => {
    currentContent = jasmine.createSpyObj('CurrentContentService', [ 'replace', 'clear' ]);
    layoutService = jasmine.createSpyObj('LayoutService', [ 'configure' ]);
    itemTabs = jasmine.createSpyObj('ItemTabs', [ 'itemChanged' ]);
    itemRouter = jasmine.createSpyObj('ItemRouter', [ 'navigateTo' ]);

    TestBed.configureTestingModule({
      providers: [
        ItemContentSyncService,
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectActiveContentData, value: readyState(createItemData(route1)) },
            { selector: fromItemContent.selectActiveContentBreadcrumbsState, value: readyState([], route1) },
            { selector: fromItemContent.selectActiveContentRouteErrorHandlingState, value: fetchingState() },
          ],
        }),
        { provide: CurrentContentService, useValue: currentContent },
        { provide: LayoutService, useValue: layoutService },
        { provide: ItemTabs, useValue: itemTabs },
        { provide: ItemRouter, useValue: itemRouter },
      ],
    });

    store = TestBed.inject(MockStore);
    TestBed.inject(ItemContentSyncService);
  });

  it('runs each sync side effect once on init', () => {
    TestBed.flushEffects();

    expect(currentContent.replace).toHaveBeenCalledTimes(1);
    expect(layoutService.configure).toHaveBeenCalledTimes(1);
    expect(layoutService.configure).toHaveBeenCalledWith({ contentDisplayType: ContentDisplayType.Show });
    expect(itemTabs.itemChanged).toHaveBeenCalledTimes(1);
  });

  it('runs item reset sync once when item id changes', () => {
    TestBed.flushEffects();
    itemTabs.itemChanged.calls.reset();

    store.overrideSelector(fromItemContent.selectActiveContentData, readyState(createItemData(route2)));
    store.refreshState();
    TestBed.flushEffects();

    expect(itemTabs.itemChanged).toHaveBeenCalledTimes(1);
  });

  it('updates current content once when item data changes to a new item', () => {
    TestBed.flushEffects();
    currentContent.replace.calls.reset();

    store.overrideSelector(fromItemContent.selectActiveContentData, readyState(createItemData(route2)));
    store.refreshState();
    TestBed.flushEffects();

    expect(currentContent.replace).toHaveBeenCalledTimes(1);
  });

  it('allows a second path-strip redirect after route error handling fails', () => {
    TestBed.flushEffects();
    itemRouter.navigateTo.calls.reset();

    const breadcrumbsError = errorState(taggedBreadcrumbForbiddenError(), routeWithPath);
    store.overrideSelector(fromItemContent.selectActiveContentBreadcrumbsState, breadcrumbsError);
    store.refreshState();
    TestBed.flushEffects();

    expect(itemRouter.navigateTo).toHaveBeenCalledTimes(1);

    // Path recovery failed: disarm the loop guard so a later user navigation is not treated as a loop.
    store.overrideSelector(
      fromItemContent.selectActiveContentRouteErrorHandlingState,
      errorState(new Error('path recovery failed')),
    );
    store.refreshState();
    TestBed.flushEffects();

    // Same breadcrumbs error re-selected (e.g. Content tab restores the remembered path).
    store.overrideSelector(
      fromItemContent.selectActiveContentBreadcrumbsState,
      errorState(taggedBreadcrumbForbiddenError(), routeWithPath),
    );
    store.refreshState();

    expect(() => TestBed.flushEffects()).not.toThrow();
    expect(itemRouter.navigateTo).toHaveBeenCalledTimes(2);
  });

  it('throws Too many redirections when breadcrumbs error re-emits without route error handling failure', () => {
    TestBed.flushEffects();
    itemRouter.navigateTo.calls.reset();

    store.overrideSelector(
      fromItemContent.selectActiveContentBreadcrumbsState,
      errorState(taggedBreadcrumbForbiddenError(), routeWithPath),
    );
    store.refreshState();
    TestBed.flushEffects();

    expect(itemRouter.navigateTo).toHaveBeenCalledTimes(1);

    // Genuine service loop: path recovery still fetching (not failed), so the guard must stay armed.
    store.overrideSelector(fromItemContent.selectActiveContentRouteErrorHandlingState, fetchingState());
    store.refreshState();
    TestBed.flushEffects();

    store.overrideSelector(
      fromItemContent.selectActiveContentBreadcrumbsState,
      errorState(taggedBreadcrumbForbiddenError(), routeWithPath),
    );
    store.refreshState();

    expect(() => TestBed.flushEffects()).toThrowError('Too many redirections (unexpected)');
    expect(itemRouter.navigateTo).toHaveBeenCalledTimes(1);
  });

  it('redirects again for another item while the previous path recovery is still in flight', () => {
    TestBed.flushEffects();
    itemRouter.navigateTo.calls.reset();

    store.overrideSelector(
      fromItemContent.selectActiveContentBreadcrumbsState,
      errorState(taggedBreadcrumbForbiddenError(), routeWithPath),
    );
    store.refreshState();
    TestBed.flushEffects();

    expect(itemRouter.navigateTo).toHaveBeenCalledTimes(1);

    // Previous item's path recovery still fetching — guard must not block a different item.
    store.overrideSelector(fromItemContent.selectActiveContentRouteErrorHandlingState, fetchingState());
    store.refreshState();
    TestBed.flushEffects();

    store.overrideSelector(
      fromItemContent.selectActiveContentBreadcrumbsState,
      errorState(taggedBreadcrumbForbiddenError(), route2WithPath),
    );
    store.refreshState();

    expect(() => TestBed.flushEffects()).not.toThrow();
    expect(itemRouter.navigateTo).toHaveBeenCalledTimes(2);
  });
});
