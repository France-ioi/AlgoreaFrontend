import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output, input } from '@angular/core';
import { ItemContentComponent } from './item-content.component';
import { ItemData } from '../../models/item-data';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';
import { itemRoute, FullItemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { TaskConfig } from '../../services/item-task.service';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { UserSessionService } from 'src/app/services/user-session.service';
import { MessageService, MessageV2 } from 'src/app/services/message.service';
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
  @Input() resultStartedAt: Date | null = null;
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
        provideMockStore(),
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

describe('ItemContentComponent – description', () => {
  let fixture: ComponentFixture<ItemContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ItemContentComponent ],
      providers: [
        provideRouter([]),
        provideMockStore(),
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
  });

  it('should render the description inside alg-description-iframe for non-task items', () => {
    const chapterItem: Item = {
      ...mockItem,
      type: 'Chapter',
      url: null,
      string: {
        ...mockItem.string,
        description: '<span data-author-test="1">chapter description</span>',
      },
    };
    fixture.componentRef.setInput('itemData', { ...mockItemData, item: chapterItem });
    fixture.detectChanges();

    const iframeDe = fixture.debugElement.query(By.css('[data-testid=item-description] iframe'));
    expect(iframeDe).not.toBeNull();
    const iframeNative = iframeDe.nativeElement as HTMLIFrameElement;
    expect(iframeNative.srcdoc).toContain('data-author-test="1"');
  });
});

describe('ItemContentComponent – description navigation', () => {
  let fixture: ComponentFixture<ItemContentComponent>;
  let component: ItemContentComponent;
  let itemRouterSpy: jasmine.SpyObj<ItemRouter>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let windowOpenSpy: jasmine.Spy;

  const route: FullItemRoute = itemRoute('activity', '10', { attemptId: 'a', path: [ '1', '2' ] });
  const chapterData: ItemData = {
    ...mockItemData,
    route,
    item: { ...mockItem, type: 'Chapter', url: null, string: { ...mockItem.string, description: '<p>x</p>' } },
  };

  beforeEach(async () => {
    itemRouterSpy = jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]);
    messageServiceSpy = jasmine.createSpyObj<MessageService>('MessageService', [ 'add' ]);
    // `openNewTab` ultimately delegates to `window.open`; spying there avoids ES-module rewrite issues.
    windowOpenSpy = spyOn(window, 'open').and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ ItemContentComponent ],
      providers: [
        provideRouter([]),
        provideMockStore(),
        { provide: UserSessionService, useValue: { userProfile$: EMPTY, isCurrentUserTemp: () => false } },
        { provide: ItemRouter, useValue: itemRouterSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    })
      .overrideComponent(ItemContentComponent, {
        remove: { imports: [ ItemDisplayComponent ] },
        add: { imports: [ MockItemDisplayComponent ] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ItemContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemData', chapterData);
    fixture.detectChanges();
  });

  it('should route to the requested item with the parent path appended when child is true', () => {
    component.onDescriptionNavigate({ itemId: '99', child: true });

    expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(1);
    const [ targetRoute, opts ] = itemRouterSpy.navigateTo.calls.mostRecent().args;
    expect(targetRoute).toEqual(itemRoute('activity', '99', { path: [ '1', '2', '10' ] }));
    expect(opts).toEqual({ useCurrentObservation: true });
  });

  it('should route to the requested item without a path when child is false', () => {
    component.onDescriptionNavigate({ itemId: '99', child: false });

    expect(itemRouterSpy.navigateTo).toHaveBeenCalledTimes(1);
    const [ targetRoute, opts ] = itemRouterSpy.navigateTo.calls.mostRecent().args;
    expect(targetRoute).toEqual(itemRoute('activity', '99'));
    expect((targetRoute as { path?: unknown }).path).toBeUndefined();
    expect(opts).toEqual({ useCurrentObservation: true });
  });

  it('should show an info toast and auto-open the URL in a new tab after the delay', fakeAsync(() => {
    component.onDescriptionNavigate({ url: 'https://example.com/x' });

    expect(messageServiceSpy.add).toHaveBeenCalledTimes(1);
    const msg = messageServiceSpy.add.calls.mostRecent().args[0];
    expect(msg.severity).toBe('info');
    expect(msg.detail).toBe('https://example.com/x');
    expect(msg.life).toBeUndefined();
    expect(typeof msg.onClick).toBe('function');

    expect(windowOpenSpy).not.toHaveBeenCalled();
    tick(899);
    expect(windowOpenSpy).not.toHaveBeenCalled();
    tick(1);
    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(windowOpenSpy.calls.mostRecent().args[0]).toBe('https://example.com/x');
    expect(windowOpenSpy.calls.mostRecent().args[1]).toBe('_blank');
  }));

  it('should open the URL immediately if the toast is clicked, and only once', fakeAsync(() => {
    component.onDescriptionNavigate({ url: 'https://example.com/y' });
    const msg: MessageV2 = messageServiceSpy.add.calls.mostRecent().args[0];

    msg.onClick!();
    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(windowOpenSpy.calls.mostRecent().args[0]).toBe('https://example.com/y');

    tick(2000); // auto-open path must NOT fire a second time after the click already opened the tab
    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
  }));

  it('should not navigate via ItemRouter for url payloads', () => {
    component.onDescriptionNavigate({ url: 'https://example.com/z' });
    expect(itemRouterSpy.navigateTo).not.toHaveBeenCalled();
  });
});
