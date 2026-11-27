import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { EMPTY, of } from 'rxjs';
import { ItemLogViewComponent } from './item-log-view.component';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { ActivityLogService } from 'src/app/data-access/activity-log.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { ObservationInfo } from 'src/app/store/observation/models';
import { ItemData } from '../../models/item-data';
import { itemRoute } from 'src/app/models/routing/item-route';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';
import { TaskHistoryElement } from 'src/app/items/api/types';
import { readyState } from 'src/app/utils/state';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { provideRouter } from '@angular/router';

const mockItem: Item = {
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

const mockItemData: ItemData = {
  route: itemRoute('activity', '1', { attemptId: '0', path: [] }),
  item: mockItem,
  breadcrumbs: [],
  currentResult: {
    attemptId: '0',
    latestActivityAt: new Date(),
    score: 0,
    validated: false,
    startedAt: new Date(),
    endedAt: null,
    allowsSubmissionsUntil: new Date(backendInfiniteDateString),
  },
};

describe('ItemLogViewComponent.backLinkHeading', () => {
  let component: ItemLogViewComponent;
  let fixture: ComponentFixture<ItemLogViewComponent>;
  let store: MockStore<object>;

  const userObsInfo: ObservationInfo = {
    route: rawGroupRoute({ id: 'u1', isUser: true }),
    name: 'Alice',
    currentUserCanGrantAccess: false,
    currentUserWatchGroup: true,
  };

  const groupObsInfo: ObservationInfo = {
    route: rawGroupRoute({ id: 'g1', isUser: false }),
    name: 'Team Phoenix',
    currentUserCanGrantAccess: false,
    currentUserWatchGroup: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemLogViewComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectBackLink, value: null },
            { selector: fromObservation.selectObservedGroupInfo, value: null },
            { selector: fromObservation.selectIsObserving, value: false },
            { selector: fromObservation.selectObservedGroupId, value: null },
            { selector: fromObservation.selectObservedGroupRoute, value: null },
          ],
        }),
        { provide: ActivityLogService, useValue: { getActivityLog: () => EMPTY } },
        { provide: UserSessionService, useValue: { userProfile$: of({ groupId: 'me' }) } },
        { provide: ActionFeedbackService, useValue: { error: jasmine.createSpy('error') } },
        { provide: ItemRouter, useValue: { url: () => undefined } },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore) as MockStore<object>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemLogViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', mockItemData);
  });

  it('returns an empty string when observedGroupInfo is null', () => {
    // The bar must be rendered as soon as backLink is set (so the user can return); the heading
    // stays empty until observation info arrives, instead of hiding the whole bar.
    store.overrideSelector(fromItemContent.selectBackLink, { url: '/source', label: 'Back' });
    store.overrideSelector(fromObservation.selectObservedGroupInfo, null);
    store.refreshState();
    expect(component.backLinkHeading()).toBe('');
  });

  it('uses the user phrasing when the observed group is a user', () => {
    store.overrideSelector(fromItemContent.selectBackLink, { url: '/source', label: 'Back' });
    store.overrideSelector(fromObservation.selectObservedGroupInfo, userObsInfo);
    store.refreshState();
    expect(component.backLinkHeading()).toBe('You are now on the history page of user Alice.');
  });

  it('uses the group phrasing when the observed group is a group', () => {
    store.overrideSelector(fromItemContent.selectBackLink, { url: '/source', label: 'Back' });
    store.overrideSelector(fromObservation.selectObservedGroupInfo, groupObsInfo);
    store.refreshState();
    expect(component.backLinkHeading()).toBe('You are now on the history page of group Team Phoenix.');
  });
});

describe('ItemLogViewComponent history element button label', () => {
  let fixture: ComponentFixture<ItemLogViewComponent>;

  function element(id: number, isCheckpoint: boolean): TaskHistoryElement {
    return {
      id,
      datetime: '2026-01-01T10:00:00Z',
      tags: [],
      idUser: 'u1',
      isCheckpoint,
      sinceEarlier: { charsAdded: 3, charsRemoved: 1 },
      ...(isCheckpoint ? { sinceEarlierCheckpoint: { charsAdded: 3, charsRemoved: 1, elementsCount: 1 } } : {}),
      activeTab: { name: 'main.py', length: 20, progLang: 'python' },
    };
  }

  /** Renders one checkpoint row with one history element expanded under it; returns the row button labels. */
  function rowButtonLabels(itemData: ItemData): string[] {
    fixture = TestBed.createComponent(ItemLogViewComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', itemData);
    fixture.detectChanges();
    const checkpoint = element(2, true);
    component.mode.set('events_and_edits');
    component.editsState.set(readyState([{ kind: 'checkpoint', at: new Date(checkpoint.datetime), checkpoint }]));
    component.expansion.expandedEdits.set(new Map([[ 2, [ element(1, false) ] ]]));
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.history-row-actions button');
    return Array.from(buttons, button => button.textContent?.trim() ?? '');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemLogViewComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectBackLink, value: null },
            { selector: fromObservation.selectObservedGroupInfo, value: null },
            { selector: fromObservation.selectIsObserving, value: false },
            { selector: fromObservation.selectObservedGroupId, value: null },
            { selector: fromObservation.selectObservedGroupRoute, value: null },
          ],
        }),
        { provide: ActivityLogService, useValue: { getActivityLog: () => EMPTY } },
        { provide: UserSessionService, useValue: { userProfile$: of({ groupId: 'me' }) } },
        { provide: ActionFeedbackService, useValue: { error: jasmine.createSpy('error') } },
        { provide: ItemRouter, useValue: { url: () => undefined } },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('shows "Show" on checkpoint and history-element rows while observing a user', () => {
    const observing: ItemData = {
      ...mockItemData,
      route: { ...mockItemData.route, observedGroup: { id: 'u1', isUser: true } },
    };
    expect(rowButtonLabels(observing)).toEqual([ 'Show', 'Show' ]);
  });

  it('shows "Restore" on checkpoint and history-element rows on the own History', () => {
    expect(rowButtonLabels(mockItemData)).toEqual([ 'Restore', 'Restore' ]);
  });

  it('shows "Show" on the own History when the attempt no longer accepts submissions', () => {
    const closed: ItemData = {
      ...mockItemData,
      currentResult: {
        attemptId: '0', latestActivityAt: new Date(), startedAt: new Date(), endedAt: null, score: 0, validated: false,
        allowsSubmissionsUntil: new Date('2000-01-01T00:00:00Z'),
      },
    };
    expect(rowButtonLabels(closed)).toEqual([ 'Show', 'Show' ]);
  });
});
