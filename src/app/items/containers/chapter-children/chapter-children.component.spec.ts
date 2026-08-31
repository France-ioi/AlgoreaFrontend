import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemData } from '../../models/item-data';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { fromObservation } from 'src/app/store/observation';
import { selectObservedGroupRouteAsItemRouteParameter } from 'src/app/models/routing/item-route-observation-selector';
import { LayoutService } from 'src/app/services/layout.service';
import { ChapterChildrenComponent } from './chapter-children.component';
import { ChapterChildrenGridComponent } from './chapter-children-grid.component';

const mockItem: Item = {
  id: 'chapter-1',
  requiresExplicitEntry: false,
  string: { title: 'Chapter', description: null, imageUrl: null, subtitle: null, languageTag: 'en' },
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
  displaySettings: displaySettingsSchema.parse({ childrenLayout: 'TwoLevels' }),
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
  url: null,
  usesApi: false,
  defaultLanguageTag: 'en',
  supportedLanguageTags: [ 'en' ],
};

const mockItemData: ItemData = {
  route: itemRoute('activity', 'chapter-1', { attemptId: '0', path: [] }),
  item: mockItem,
  breadcrumbs: [],
  currentResult: {
    attemptId: '0',
    latestActivityAt: new Date(),
    score: 0,
    validated: true,
    startedAt: new Date(),
    allowsSubmissionsUntil: new Date(),
  },
};

type NestedChildren = NonNullable<ItemChildren[number]['children']>;

function makeApiChild(
  id: string,
  title: string,
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
  };
}

describe('ChapterChildrenComponent TwoLevels', () => {
  let fixture: ComponentFixture<ChapterChildrenComponent>;
  let getChildren: jasmine.SpyObj<Pick<GetItemChildrenService, 'get'>>;

  beforeEach(async () => {
    getChildren = jasmine.createSpyObj('GetItemChildrenService', [ 'get' ]);

    await TestBed.configureTestingModule({
      imports: [ ChapterChildrenComponent ],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: fromObservation.selectObservedGroupId, value: null },
            { selector: selectObservedGroupRouteAsItemRouteParameter, value: {} },
          ],
        }),
        { provide: GetItemChildrenService, useValue: getChildren },
        {
          provide: LayoutService,
          useValue: {
            leftMenu$: of({ shown: true }),
            toggleLeftMenu: jasmine.createSpy('toggleLeftMenu'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChapterChildrenComponent);
  });

  async function renderWithChildren(children: ItemChildren): Promise<void> {
    getChildren.get.and.returnValue(of(children));
    fixture.componentRef.setInput('itemData', mockItemData);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders an h2 for every L1 child and a compact grid only when nested children exist', async () => {
    await renderWithChildren([
      makeApiChild('with-kids', 'Has grand-children', [
        makeApiChild('g1', 'Grand-child'),
      ]),
      makeApiChild('empty', 'Eligible empty', []),
      makeApiChild('absent', 'Not eligible'),
    ]);

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('h2.alg-h2') as NodeListOf<HTMLElement>,
    );
    expect(headings.map(h => h.textContent?.trim())).toEqual([
      'Has grand-children',
      'Eligible empty',
      'Not eligible',
    ]);

    const grids = fixture.debugElement.queryAll(By.directive(ChapterChildrenGridComponent));
    expect(grids).toHaveSize(1);
    expect(grids[0]?.componentInstance.size()).toBe('compact');
    expect(grids[0]?.componentInstance.children()).toHaveSize(1);

    const emptyMessages = Array.from(
      fixture.nativeElement.querySelectorAll('.two-levels-empty') as NodeListOf<HTMLElement>,
    );
    expect(emptyMessages).toHaveSize(2);
    expect(emptyMessages[0]?.textContent?.trim()).toBe(
      'This chapter does not have any content visible to you.',
    );
  });

  it('renders consecutive L1 tasks as a full-size grid section', async () => {
    await renderWithChildren([
      { ...makeApiChild('t1', 'Task 1'), type: 'Task' },
      { ...makeApiChild('t2', 'Task 2'), type: 'Task' },
      makeApiChild('c1', 'Chapter', [ makeApiChild('g1', 'Grand') ]),
      { ...makeApiChild('t3', 'Task 3'), type: 'Task' },
    ]);

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('h2.alg-h2') as NodeListOf<HTMLElement>,
    );
    expect(headings.map(h => h.textContent?.trim())).toEqual([ 'Chapter' ]);

    const grids = fixture.debugElement.queryAll(By.directive(ChapterChildrenGridComponent));
    expect(grids).toHaveSize(3);
    expect(grids[0]?.componentInstance.size()).toBe('normal');
    expect(grids[0]?.componentInstance.children().map((c: { id: string }) => c.id)).toEqual([ 't1', 't2' ]);
    expect(grids[1]?.componentInstance.size()).toBe('compact');
    expect(grids[2]?.componentInstance.size()).toBe('normal');
    expect(grids[2]?.componentInstance.children().map((c: { id: string }) => c.id)).toEqual([ 't3' ]);
  });
});
