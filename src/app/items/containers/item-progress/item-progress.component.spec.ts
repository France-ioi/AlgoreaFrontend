import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ItemProgressComponent } from './item-progress.component';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';
import { ObservationInfo } from 'src/app/store/observation/models';
import { rawGroupRoute } from 'src/app/models/routing/group-route';

const baseItem: Item = {
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
  type: 'Chapter',
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
  url: 'http://example.com/chapter',
  usesApi: false,
  defaultLanguageTag: 'en',
  supportedLanguageTags: [ 'en' ],
};

const groupObsInfo: ObservationInfo = {
  route: rawGroupRoute({ id: 'g1', isUser: false }),
  name: 'Team Phoenix',
  currentUserCanGrantAccess: false,
  currentUserWatchGroup: true,
};

const userObsInfo: ObservationInfo = {
  route: rawGroupRoute({ id: 'u1', isUser: true }),
  name: 'Alice',
  currentUserCanGrantAccess: false,
  currentUserWatchGroup: true,
};

describe('ItemProgressComponent', () => {
  let fixture: ComponentFixture<ItemProgressComponent>;
  let store: MockStore<object>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemProgressComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectActiveContentItem, value: baseItem },
            { selector: fromObservation.selectIsObserving, value: false },
            { selector: fromObservation.selectObservedGroupInfo, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore) as MockStore<object>;
    fixture = TestBed.createComponent(ItemProgressComponent);
  });

  function setStoreState(options: {
    item?: Item | null,
    isObserving?: boolean,
    observedGroup?: ObservationInfo | null,
  }): void {
    if (options.item !== undefined) {
      store.overrideSelector(fromItemContent.selectActiveContentItem, options.item);
    }
    if (options.isObserving !== undefined) {
      store.overrideSelector(fromObservation.selectIsObserving, options.isObserving);
    }
    if (options.observedGroup !== undefined) {
      store.overrideSelector(fromObservation.selectObservedGroupInfo, options.observedGroup);
    }
    store.refreshState();
    fixture.detectChanges();
  }

  it('shows the content-denied message when the user cannot view and is not observing', () => {
    setStoreState({
      item: {
        ...baseItem,
        permissions: { ...baseItem.permissions, canView: ItemViewPerm.None },
      },
      isObserving: false,
    });

    expect(fixture.nativeElement.textContent).toContain('You are not allowed to view this content.');
    expect(fixture.nativeElement.querySelector('alg-item-user-progress')).toBeNull();
    expect(fixture.nativeElement.querySelector('alg-item-group-progress')).toBeNull();
  });

  it('shows the observation-denied message when watching without permission', () => {
    setStoreState({
      item: {
        ...baseItem,
        permissions: { ...baseItem.permissions, canWatch: ItemWatchPerm.None },
      },
      isObserving: true,
      observedGroup: groupObsInfo,
    });

    expect(fixture.nativeElement.textContent).toContain('You are not allowed to view the progress of other users on this content.');
  });

  it('renders user progress when the user can view their own content', () => {
    setStoreState({ isObserving: false });

    expect(fixture.nativeElement.querySelector('alg-item-user-progress')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('alg-item-group-progress')).toBeNull();
  });

  it('renders user progress when observing a single user', () => {
    setStoreState({
      item: {
        ...baseItem,
        permissions: { ...baseItem.permissions, canWatch: ItemWatchPerm.Result },
      },
      isObserving: true,
      observedGroup: userObsInfo,
    });

    expect(fixture.nativeElement.querySelector('alg-item-user-progress')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('alg-item-group-progress')).toBeNull();
  });

  it('renders group progress when observing a non-user group with watch permission', () => {
    setStoreState({
      item: {
        ...baseItem,
        permissions: { ...baseItem.permissions, canWatch: ItemWatchPerm.Result },
      },
      isObserving: true,
      observedGroup: groupObsInfo,
    });

    expect(fixture.nativeElement.querySelector('alg-item-group-progress')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('alg-item-user-progress')).toBeNull();
  });
});
