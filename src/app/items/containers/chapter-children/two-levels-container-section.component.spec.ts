import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { fromObservation } from 'src/app/store/observation';
import { selectObservedGroupRouteAsItemRouteParameter } from 'src/app/models/routing/item-route-observation-selector';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { mapChildWithAdditions } from '../item-children-list/map-item-child-with-additions';
import { ChapterChildrenGridComponent } from './chapter-children-grid.component';
import { TwoLevelsContainerSectionComponent } from './two-levels-container-section.component';

type NestedChildren = NonNullable<ItemChildren[number]['children']>;

function makeApiChild(
  id: string,
  title: string,
  overrides: Partial<ItemChildren[number]> = {},
  children?: NestedChildren,
): ItemChildren[number] {
  return {
    id,
    type: 'Chapter',
    order: 0,
    category: 'Undefined',
    permissions: {
      canView: ItemViewPerm.Content,
      canGrantView: ItemGrantViewPerm.None,
      canWatch: ItemWatchPerm.None,
      canEdit: ItemEditPerm.None,
      isOwner: false,
    },
    scoreWeight: 1,
    contentViewPropagation: 'as_info',
    upperViewLevelsPropagation: 'as_is',
    grantViewPropagation: false,
    watchPropagation: false,
    editPropagation: false,
    bestScore: 0,
    string: { title, languageTag: 'en', imageUrl: null, subtitle: null },
    results: [],
    noScore: false,
    displaySettings: displaySettingsSchema.parse({}),
    ...(children !== undefined ? { children } : {}),
    ...overrides,
  };
}

function makeItem(child: ItemChildren[number]): ItemChildWithAdditions {
  return mapChildWithAdditions(child);
}

const startedResult = {
  attemptId: 'child-attempt',
  latestActivityAt: new Date('2020-01-02'),
  startedAt: new Date('2020-01-01'),
  scoreComputed: 0,
  validated: false,
};

const infoOnlyPermissions = {
  canView: ItemViewPerm.Info,
  canGrantView: ItemGrantViewPerm.None,
  canWatch: ItemWatchPerm.None,
  canEdit: ItemEditPerm.None,
  isOwner: false,
} as const;

describe('TwoLevelsContainerSectionComponent', () => {
  let fixture: ComponentFixture<TwoLevelsContainerSectionComponent>;
  let getChildren: jasmine.SpyObj<Pick<GetItemChildrenService, 'get'>>;
  let resultActions: jasmine.SpyObj<Pick<ResultActionsService, 'start'>>;
  let store: MockStore;

  beforeEach(async () => {
    getChildren = jasmine.createSpyObj('GetItemChildrenService', [ 'get' ]);
    resultActions = jasmine.createSpyObj('ResultActionsService', [ 'start' ]);

    await TestBed.configureTestingModule({
      imports: [ TwoLevelsContainerSectionComponent ],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: fromObservation.selectObservedGroupId, value: null },
            { selector: selectObservedGroupRouteAsItemRouteParameter, value: {} },
          ],
        }),
        { provide: GetItemChildrenService, useValue: getChildren },
        { provide: ResultActionsService, useValue: resultActions },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(TwoLevelsContainerSectionComponent);
    fixture.componentRef.setInput('path', [ 'chapter-1' ]);
    fixture.componentRef.setInput('parentAttemptId', '0');
    fixture.componentRef.setInput('leftMenuShown', true);
  });

  async function render(item: ItemChildWithAdditions): Promise<void> {
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows an info message for locked (info-only) chapters and keeps the title link', async () => {
    await render(makeItem(makeApiChild('locked', 'Locked chapter', {
      permissions: infoOnlyPermissions,
    })));

    expect(fixture.nativeElement.querySelector('h2 a')?.textContent?.trim()).toBe('Locked chapter');
    expect(fixture.nativeElement.querySelector('.two-levels-info')?.textContent?.trim()).toContain(
      'Your current access rights do not allow you to list the content of this chapter.',
    );
    expect(resultActions.start).not.toHaveBeenCalled();
    expect(getChildren.get).not.toHaveBeenCalled();
    expect(fixture.debugElement.query(By.directive(ChapterChildrenGridComponent))).toBeNull();
  });

  it('shows a skill-specific lock message for locked skills', async () => {
    await render(makeItem(makeApiChild('locked-skill', 'Locked skill', {
      type: 'Skill',
      permissions: infoOnlyPermissions,
    })));

    expect(fixture.nativeElement.querySelector('.two-levels-info')?.textContent?.trim()).toContain(
      'Your current access rights do not allow you to list the content of this skill.',
    );
  });

  it('shows an explicit-entry message without starting when required and no result', async () => {
    await render(makeItem(makeApiChild('need-enter', 'Needs enter', { requiresExplicitEntry: true })));

    expect(fixture.nativeElement.querySelector('.two-levels-info')?.textContent?.trim()).toContain(
      'This chapter requires a manual action to enter',
    );
    expect(resultActions.start).not.toHaveBeenCalled();
    expect(getChildren.get).not.toHaveBeenCalled();
  });

  it('uses nested children when a result is elected', async () => {
    await render(makeItem(makeApiChild(
      'with-kids',
      'Has kids',
      { results: [ startedResult ] },
      [ makeApiChild('g1', 'Grand') ],
    )));

    expect(resultActions.start).not.toHaveBeenCalled();
    expect(getChildren.get).not.toHaveBeenCalled();
    const grid = fixture.debugElement.query(By.directive(ChapterChildrenGridComponent));
    expect(grid).not.toBeNull();
    expect(grid.componentInstance.size()).toBe('compact');
    expect(grid.componentInstance.children().map((c: { id: string }) => c.id)).toEqual([ 'g1' ]);
    expect(grid.componentInstance.parentAttemptId()).toBe('child-attempt');
  });

  it('shows the empty message when nested children are an empty list', async () => {
    await render(makeItem(makeApiChild('empty', 'Empty', { results: [ startedResult ] }, [])));

    expect(fixture.nativeElement.querySelector('.two-levels-empty')?.textContent?.trim()).toBe(
      'This chapter does not have any content visible to you.',
    );
    expect(fixture.debugElement.query(By.directive(ChapterChildrenGridComponent))).toBeNull();
  });

  it('shows a skill-specific empty message for empty nested skills', async () => {
    await render(makeItem(makeApiChild('empty-skill', 'Empty skill', {
      type: 'Skill',
      results: [ startedResult ],
    }, [])));

    expect(fixture.nativeElement.querySelector('.two-levels-empty')?.textContent?.trim()).toBe(
      'This skill does not have any content visible to you.',
    );
  });

  it('starts a result then fetches children when none is elected', async () => {
    resultActions.start.and.returnValue(of({
      attemptId: 'started-1',
      latestActivityAt: new Date(),
      startedAt: new Date(),
      score: 0,
      validated: false,
      allowsSubmissionsUntil: new Date(),
    }));
    getChildren.get.and.returnValue(of([ makeApiChild('g1', 'Grand') ]));

    await render(makeItem(makeApiChild('to-start', 'Start me')));

    expect(resultActions.start).toHaveBeenCalledOnceWith([ 'chapter-1', 'to-start' ], '0');
    expect(getChildren.get).toHaveBeenCalledOnceWith('to-start', 'started-1', { watchedGroupId: undefined });
    const grid = fixture.debugElement.query(By.directive(ChapterChildrenGridComponent));
    expect(grid.componentInstance.children().map((c: { id: string }) => c.id)).toEqual([ 'g1' ]);
    expect(grid.componentInstance.parentAttemptId()).toBe('started-1');
  });

  it('fetches children when a result exists but nested children are absent', async () => {
    getChildren.get.and.returnValue(of([ makeApiChild('g2', 'Fetched') ]));

    await render(makeItem(makeApiChild('fetch-me', 'Fetch me', { results: [ startedResult ] })));

    expect(resultActions.start).not.toHaveBeenCalled();
    expect(getChildren.get).toHaveBeenCalledOnceWith('fetch-me', 'child-attempt', { watchedGroupId: undefined });
    expect(
      fixture.debugElement.query(By.directive(ChapterChildrenGridComponent))
        .componentInstance.children().map((c: { id: string }) => c.id),
    ).toEqual([ 'g2' ]);
  });

  it('forwards watchedGroupId when an observed group is set', async () => {
    store.overrideSelector(fromObservation.selectObservedGroupId, 'group-99');
    store.refreshState();
    getChildren.get.and.returnValue(of([ makeApiChild('g2', 'Fetched') ]));

    await render(makeItem(makeApiChild('fetch-me', 'Fetch me', { results: [ startedResult ] })));

    expect(getChildren.get).toHaveBeenCalledOnceWith('fetch-me', 'child-attempt', { watchedGroupId: 'group-99' });
  });

  it('shows an error with retry when start fails', async () => {
    resultActions.start.and.returnValue(throwError(() => new Error('boom')));

    await render(makeItem(makeApiChild('fail', 'Fail')));

    expect(fixture.nativeElement.textContent).toContain('Error while loading this content');
    resultActions.start.and.returnValue(of({
      attemptId: 'started-retry',
      latestActivityAt: new Date(),
      startedAt: new Date(),
      score: 0,
      validated: false,
      allowsSubmissionsUntil: new Date(),
    }));
    getChildren.get.and.returnValue(of([]));
    fixture.componentInstance.refresh();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(resultActions.start).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('.two-levels-empty')).not.toBeNull();
  });
});
