import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { EMPTY } from 'rxjs';
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
import { readyState } from 'src/app/utils/state';
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

describe('ItemTaskFlowService', () => {
  let store: MockStore;
  let setInfo: jasmine.Spy;

  const route1 = itemRoute('activity', '1', { attemptId: '0', path: [] });
  const route2 = itemRoute('activity', '2', { attemptId: '0', path: [] });

  beforeEach(() => {
    setInfo = jasmine.createSpy('setInfo');

    TestBed.configureTestingModule({
      providers: [
        ItemTaskFlowService,
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectActiveContentRoute, value: route1 },
            { selector: fromItemContent.selectActiveContentData, value: readyState(createItemData(route1)) },
          ],
        }),
        {
          provide: InitialAnswerDataSource,
          useValue: { setInfo, error$: EMPTY },
        },
        { provide: LocaleService, useValue: { currentLang: { tag: 'en' } } },
        { provide: ConfirmationModalService, useValue: { open: (): typeof EMPTY => EMPTY } },
        { provide: ItemRouter, useValue: jasmine.createSpyObj('ItemRouter', [ 'navigateTo' ]) },
        { provide: APPCONFIG, useValue: { redirects: {} } },
      ],
    });

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
