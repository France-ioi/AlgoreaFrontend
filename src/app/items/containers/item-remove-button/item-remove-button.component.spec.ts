import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ItemRemoveButtonComponent } from './item-remove-button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { RemoveItemService } from '../../data-access/remove-item.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { GetItemChildrenService } from '../../../data-access/get-item-children.service';
import { DEFAULT_ACTIVITY_ROUTE } from 'src/app/config/default-route-tokens';
import { ItemData } from '../../models/item-data';
import { itemRoute } from 'src/app/models/routing/item-route';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';

const mockItem: Item = {
  id: 'task-1',
  requiresExplicitEntry: false,
  string: { title: 'My task', description: null, imageUrl: null, subtitle: null, languageTag: 'en' },
  bestScore: 0,
  permissions: {
    canView: ItemViewPerm.Content,
    canGrantView: ItemGrantViewPerm.None,
    canEdit: ItemEditPerm.None,
    canWatch: ItemWatchPerm.None,
    isOwner: true,
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

const mockItemData: ItemData = {
  route: itemRoute('activity', 'task-1', { attemptId: '0', path: [] }),
  item: mockItem,
  breadcrumbs: [],
};

describe('ItemRemoveButtonComponent.onDeleteItem', () => {
  let fixture: ComponentFixture<ItemRemoveButtonComponent>;
  let component: ItemRemoveButtonComponent;
  let confirmationModalService: jasmine.SpyObj<Pick<ConfirmationModalService, 'open'>>;
  let removeItemService: jasmine.SpyObj<Pick<RemoveItemService, 'delete'>>;

  beforeEach(async () => {
    confirmationModalService = jasmine.createSpyObj('ConfirmationModalService', [ 'open' ]);
    removeItemService = jasmine.createSpyObj('RemoveItemService', [ 'delete' ]);

    await TestBed.configureTestingModule({
      imports: [ ItemRemoveButtonComponent ],
      providers: [
        { provide: ConfirmationModalService, useValue: confirmationModalService },
        { provide: RemoveItemService, useValue: removeItemService },
        { provide: ActionFeedbackService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } },
        { provide: ItemRouter, useValue: { navigateTo: jasmine.createSpy('navigateTo') } },
        { provide: GetItemChildrenService, useValue: { get: () => of([]) } },
        { provide: DEFAULT_ACTIVITY_ROUTE, useValue: itemRoute('activity', 'root', { path: [] }) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemRemoveButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', mockItemData);
    fixture.detectChanges();
  });

  it('opens the confirmation modal once and deletes when accepted', () => {
    confirmationModalService.open.and.returnValue(of(true));
    removeItemService.delete.and.returnValue(of(undefined));
    const confirmRemovalSpy = spyOn(component.confirmRemoval, 'emit');

    component.onDeleteItem();

    expect(confirmationModalService.open).toHaveBeenCalledTimes(1);
    expect(removeItemService.delete).toHaveBeenCalledOnceWith('task-1');
    expect(confirmRemovalSpy).toHaveBeenCalledTimes(1);
  });

  it('does not delete or emit confirmRemoval when rejected', () => {
    confirmationModalService.open.and.returnValue(of(false));
    const confirmRemovalSpy = spyOn(component.confirmRemoval, 'emit');

    component.onDeleteItem();

    expect(confirmationModalService.open).toHaveBeenCalledTimes(1);
    expect(removeItemService.delete).not.toHaveBeenCalled();
    expect(confirmRemovalSpy).not.toHaveBeenCalled();
  });
});
