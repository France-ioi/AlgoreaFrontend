import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output, input } from '@angular/core';
import { ItemContentComponent } from './item-content.component';
import { ItemData } from '../../models/item-data';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';
import { itemRoute, FullItemRoute } from 'src/app/models/routing/item-route';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { TaskConfig } from '../../services/item-task.service';
import { provideRouter } from '@angular/router';
import { UserSessionService } from 'src/app/services/user-session.service';
import { EMPTY } from 'rxjs';
import { ItemViewPerm } from '../../models/item-view-permission';
import { ItemGrantViewPerm } from '../../models/item-grant-view-permission';
import { ItemEditPerm } from '../../models/item-edit-permission';
import { ItemWatchPerm } from '../../models/item-watch-permission';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'alg-item-display',
  template: '',
})
class MockItemDisplayComponent {
  route = input.required<FullItemRoute>();
  url = input.required<string>();
  @Input() editingPermission: unknown;
  @Input() attemptId?: string;
  @Input() view?: string;
  @Input() taskConfig: TaskConfig = { readOnly: false, initialAnswer: undefined };
  @Input() savingAnswer = false;
  @Output() viewChange = new EventEmitter<string>();
  @Output() tabsChange = new EventEmitter<TaskTab[]>();
  @Output() scoreChange = new EventEmitter<number>();
  @Output() skipSave = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() editorUrl = new EventEmitter<string | undefined>();
  @Output() disablePlatformProgress = new EventEmitter<boolean>();
  @Output() fullFrame = new EventEmitter<boolean>();
  @Output() loadingComplete = new EventEmitter<boolean>();
}

const mockRoute = itemRoute('activity', '1', { attemptId: '0', path: [] });

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
  },
  type: 'Task',
  promptToJoinGroupByCode: false,
  textId: null,
  validationType: 'None',
  noScore: false,
  titleBarVisible: true,
  fullScreen: 'default',
  childrenLayout: 'List',
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
};

const mockItemData: ItemData = {
  route: mockRoute,
  item: mockItem,
  breadcrumbs: [],
  currentResult: {
    attemptId: '0', latestActivityAt: new Date(), score: 0, validated: false, startedAt: new Date(), allowsSubmissionsUntil: new Date(),
  },
};

function queryComponent(debugEl: DebugElement): MockItemDisplayComponent | undefined {
  return debugEl.query(By.directive(MockItemDisplayComponent))?.componentInstance as MockItemDisplayComponent | undefined;
}

describe('ItemContentComponent – task retry', () => {
  let component: ItemContentComponent;
  let fixture: ComponentFixture<ItemContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemContentComponent ],
      providers: [
        provideRouter([]),
        {
          provide: UserSessionService,
          useValue: { userProfile$: EMPTY, isCurrentUserTemp: () => false },
        },
      ],
    })
      .overrideComponent(ItemContentComponent, {
        remove: { imports: [ ItemDisplayComponent ] },
        add: { imports: [ MockItemDisplayComponent ] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ItemContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', mockItemData);
    component.taskConfig = { readOnly: false, initialAnswer: null };
    fixture.detectChanges();
  });

  it('should initialize isTaskLoaded to false', () => {
    expect(component.isTaskLoaded()).toBeFalse();
  });

  it('should initialize showTaskDisplay to true', () => {
    expect(component.showTaskDisplay()).toBeTrue();
  });

  it('should reset isTaskLoaded to false on retry', () => {
    component.isTaskLoaded.set(true);
    expect(component.isTaskLoaded()).toBeTrue();
    component.onTaskRetry();
    expect(component.isTaskLoaded()).toBeFalse();
  });

  it('should toggle showTaskDisplay off then back on during retry', fakeAsync(() => {
    expect(component.showTaskDisplay()).toBeTrue();
    component.onTaskRetry();
    expect(component.showTaskDisplay()).toBeFalse();
    tick();
    expect(component.showTaskDisplay()).toBeTrue();
  }));

  it('should recreate ItemDisplayComponent on retry', fakeAsync(() => {
    fixture.detectChanges();

    const firstInstance = queryComponent(fixture.debugElement);
    expect(firstInstance).toBeTruthy();

    component.onTaskRetry();
    fixture.detectChanges();

    expect(queryComponent(fixture.debugElement)).toBeUndefined();

    tick();
    fixture.detectChanges();

    const secondInstance = queryComponent(fixture.debugElement);
    expect(secondInstance).toBeTruthy();
    expect(secondInstance).not.toBe(firstInstance);
  }));

  it('should show the task-loader when isTaskLoaded is false', () => {
    component.isTaskLoaded.set(false);
    fixture.detectChanges();
    const taskLoader = fixture.debugElement.query(By.css('alg-task-loader'));
    expect(taskLoader).toBeTruthy();
  });

  it('should hide the task-loader when isTaskLoaded is true', () => {
    component.isTaskLoaded.set(true);
    fixture.detectChanges();
    const taskLoader = fixture.debugElement.query(By.css('alg-task-loader'));
    expect(taskLoader).toBeFalsy();
  });

  it('should show task-loader after retry even if it was previously loaded', fakeAsync(() => {
    component.isTaskLoaded.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('alg-task-loader'))).toBeFalsy();

    component.onTaskRetry();
    tick();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('alg-task-loader'))).toBeTruthy();
  }));

  it('should not emit refresh output on task retry', () => {
    let refreshEmitted = false;
    component.refresh.subscribe(() => refreshEmitted = true);
    component.onTaskRetry();
    expect(refreshEmitted).toBeFalse();
  });
});
