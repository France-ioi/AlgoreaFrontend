import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ItemAllStringsFormComponent } from '../item-strings-form-group/item-all-strings-form.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ItemEditWrapperComponent } from './item-edit-wrapper.component';
import { ItemData } from '../../models/item-data';
import { fromItemContent } from '../../store';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { itemRoute } from 'src/app/models/routing/item-route';
import { APPCONFIG } from 'src/app/config';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { UpdateItemService } from '../../data-access/update-item.service';
import { UpdateItemStringService } from '../../data-access/update-item-string.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { PendingChangesService } from 'src/app/services/pending-changes-service';
import { DeleteItemStringService } from 'src/app/items/data-access/delete-item-string.service';
import { GetItemChildrenService } from 'src/app/data-access/get-item-children.service';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { RemoveItemService } from '../../data-access/remove-item.service';
import { of } from 'rxjs';

function buildItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    requiresExplicitEntry: false,
    string: {
      title: 'My title',
      subtitle: 'Sub',
      description: 'Desc',
      imageUrl: null,
      languageTag: 'en',
    },
    bestScore: 0,
    permissions: {
      canView: ItemViewPerm.Content,
      canGrantView: ItemGrantViewPerm.None,
      canEdit: ItemEditPerm.All,
      canWatch: ItemWatchPerm.None,
      isOwner: true,
      canRequestHelp: false,
    },
    type: 'Skill',
    displaySettings: displaySettingsSchema.parse({}),
    textId: null,
    validationType: 'None',
    noScore: false,
    allowsMultipleAttempts: false,
    duration: null,
    enteringTimeMin: new Date('1000-01-01T00:00:00Z'),
    enteringTimeMax: new Date('9999-12-31T23:59:59Z'),
    entryParticipantType: 'User',
    entryFrozenTeams: false,
    entryMaxTeamSize: 0,
    entryMinAdmittedMembersRatio: 'None',
    url: '',
    usesApi: false,
    defaultLanguageTag: 'en',
    supportedLanguageTags: [ 'en' ],
    ...overrides,
  };
}

function buildItemData(item: Item): ItemData {
  return {
    route: itemRoute('activity', item.id, { attemptId: '0', path: [] }),
    item,
    breadcrumbs: [],
    currentResult: {
      attemptId: '0',
      latestActivityAt: new Date(),
      score: 0,
      validated: false,
      startedAt: new Date(),
      allowsSubmissionsUntil: new Date(),
    },
  };
}

function wrapperProviders(
  appConfig: { apiUrl: string, languages: { tag: string, label: string }[] },
  seedItem: Item = buildItem(),
): unknown[] {
  const seedData = buildItemData(seedItem);
  return [
    provideMockStore({
      selectors: [
        { selector: fromItemContent.selectActiveContentItem, value: seedData.item },
        { selector: fromItemContent.selectActiveContentRoute, value: seedData.route },
        { selector: fromItemContent.selectActiveContentCurrentResult, value: seedData.currentResult ?? null },
      ],
    }),
    { provide: APPCONFIG, useValue: appConfig },
    { provide: CurrentContentService, useValue: { forceNavMenuReload: () => {} } },
    { provide: UpdateItemService, useValue: { updateItem: () => of(undefined) } },
    { provide: UpdateItemStringService, useValue: { updateItem: () => of(undefined) } },
    { provide: DeleteItemStringService, useValue: { delete: () => of(undefined) } },
    { provide: ActionFeedbackService, useValue: { success: () => {}, error: () => {}, unexpectedError: () => {} } },
    { provide: PendingChangesService, useValue: { set: () => {}, clear: () => {} } },
    { provide: GetItemChildrenService, useValue: { get: () => of([]) } },
    { provide: ConfirmationModalService, useValue: { confirm: () => of(true) } },
    { provide: ItemRouter, useValue: { navigate: () => {} } },
    { provide: RemoveItemService, useValue: { remove: () => of(undefined) } },
  ];
}

describe('ItemEditWrapperComponent – form pristine on load', () => {
  let fixture: ComponentFixture<ItemEditWrapperComponent>;
  let component: ItemEditWrapperComponent;
  let store: MockStore;

  async function setup(appConfig: { apiUrl: string, languages: { tag: string, label: string }[] }): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ ItemEditWrapperComponent ],
      providers: wrapperProviders(appConfig),
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(ItemEditWrapperComponent);
    component = fixture.componentInstance;
  }

  async function loadItem(item: Item): Promise<void> {
    const data = buildItemData(item);
    store.overrideSelector(fromItemContent.selectActiveContentItem, data.item);
    store.overrideSelector(fromItemContent.selectActiveContentRoute, data.route);
    store.overrideSelector(fromItemContent.selectActiveContentCurrentResult, data.currentResult ?? null);
    store.refreshState();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  describe('mono-language platform', () => {
    beforeEach(async () => {
      await setup({
        apiUrl: 'http://test',
        languages: [ { tag: 'en', label: 'English' } ],
      });
    });

    it('stays pristine after loading a single-language item', async () => {
      await loadItem(buildItem());
      expect(component.itemForm.dirty).toBeFalse();
      expect(component.isDirty()).toBeFalse();
    });
  });

  describe('multilingual platform', () => {
    beforeEach(async () => {
      await setup({
        apiUrl: 'http://test',
        languages: [
          { tag: 'en', label: 'English' },
          { tag: 'fr', label: 'French' },
        ],
      });
    });

    it('stays pristine when the item only supports one language', async () => {
      await loadItem(buildItem());
      expect(component.itemForm.dirty).toBeFalse();
      expect(component.isDirty()).toBeFalse();
    });
  });

  describe('user edits', () => {
    let mainContent: HTMLDivElement;

    beforeEach(async () => {
      mainContent = document.createElement('div');
      mainContent.className = 'main-content';
      document.body.appendChild(mainContent);
      await setup({
        apiUrl: 'http://test',
        languages: [ { tag: 'en', label: 'English' } ],
      });
    });

    afterEach(() => {
      mainContent.remove();
    });

    it('becomes dirty when the title changes', async () => {
      await loadItem(buildItem());
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();
      const stringsForm = fixture.debugElement.query(By.directive(ItemAllStringsFormComponent))
        .componentInstance as ItemAllStringsFormComponent;
      stringsForm.allStrings.at(0).patchValue({
        languageTag: 'en',
        title: 'Changed title',
        subtitle: 'Sub',
        description: 'Desc',
      });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.itemForm.dirty).toBeTrue();
      expect(component.isDirty()).toBeTrue();
    });

    it('preserves user edits on partial server baseline resync', async () => {
      const initialItem = buildItem();
      await loadItem(initialItem);
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();
      const stringsForm = fixture.debugElement.query(By.directive(ItemAllStringsFormComponent))
        .componentInstance as ItemAllStringsFormComponent;
      stringsForm.allStrings.at(0).patchValue({
        languageTag: 'en',
        title: 'Changed title',
        subtitle: 'Sub',
        description: 'Desc',
      });
      fixture.detectChanges();
      await fixture.whenStable();

      const serverRefreshedItem = buildItem({
        string: {
          ...initialItem.string,
          description: 'Server updated description',
        },
      });
      const refreshedData = buildItemData(serverRefreshedItem);
      store.overrideSelector(fromItemContent.selectActiveContentItem, refreshedData.item);
      store.overrideSelector(fromItemContent.selectActiveContentRoute, refreshedData.route);
      store.overrideSelector(fromItemContent.selectActiveContentCurrentResult, refreshedData.currentResult ?? null);
      store.refreshState();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(stringsForm.allStrings.at(0).getRawValue().title).toBe('Changed title');
      expect(component.itemForm.dirty).toBeTrue();
    });

    it('resets the form when the active item id changes', async () => {
      await loadItem(buildItem({ id: 'item-1', string: { ...buildItem().string, title: 'First item' } }));
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();
      const stringsForm = fixture.debugElement.query(By.directive(ItemAllStringsFormComponent))
        .componentInstance as ItemAllStringsFormComponent;
      stringsForm.allStrings.at(0).patchValue({
        languageTag: 'en',
        title: 'Changed title',
        subtitle: 'Sub',
        description: 'Desc',
      });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.itemForm.dirty).toBeTrue();

      await loadItem(buildItem({ id: 'item-2', string: { ...buildItem().string, title: 'Second item' } }));

      expect(stringsForm.allStrings.at(0).getRawValue().title).toBe('Second item');
      expect(component.itemForm.dirty).toBeFalse();
    });
  });

  describe('showDescription', () => {
    beforeEach(async () => {
      await setup({
        apiUrl: 'http://test',
        languages: [ { tag: 'en', label: 'English' } ],
      });
    });

    it('hides the description editor when there is no current result', async () => {
      const item = buildItem();
      const data = buildItemData(item);
      store.overrideSelector(fromItemContent.selectActiveContentItem, data.item);
      store.overrideSelector(fromItemContent.selectActiveContentRoute, data.route);
      store.overrideSelector(fromItemContent.selectActiveContentCurrentResult, null);
      store.refreshState();
      fixture.detectChanges();
      await fixture.whenStable();

      const stringsForm = fixture.debugElement.query(By.directive(ItemAllStringsFormComponent))
        .componentInstance as ItemAllStringsFormComponent;
      expect(stringsForm.showDescription()).toBeFalse();
    });

    it('shows the description editor for non-Task items with a current result', async () => {
      await loadItem(buildItem({ type: 'Skill' }));

      const stringsForm = fixture.debugElement.query(By.directive(ItemAllStringsFormComponent))
        .componentInstance as ItemAllStringsFormComponent;
      expect(stringsForm.showDescription()).toBeTrue();
    });
  });
});
