import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { selectObservedGroupRouteAsItemRouteParameter } from 'src/app/models/routing/item-route-observation-selector';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { ChapterChildrenGridComponent } from './chapter-children-grid.component';

const child: ItemChildWithAdditions = {
  id: 'c1',
  string: { title: 'Card', subtitle: null },
  displaySettings: displaySettingsSchema.parse({}),
  category: 'Undefined',
  type: 'Task',
  bestScore: 0,
  isLocked: false,
  noScore: true,
};

describe('ChapterChildrenGridComponent', () => {
  let fixture: ComponentFixture<ChapterChildrenGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ChapterChildrenGridComponent ],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [ { selector: selectObservedGroupRouteAsItemRouteParameter, value: {} } ],
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChapterChildrenGridComponent);
    fixture.componentRef.setInput('children', [ child ]);
    fixture.componentRef.setInput('path', [ 'parent' ]);
    fixture.componentRef.setInput('parentAttemptId', '0');
  });

  it('applies the compact class when size is compact', () => {
    fixture.componentRef.setInput('size', 'compact');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.grid-container.compact')).toBeTruthy();
  });

  it('does not apply the compact class by default', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.grid-container.compact')).toBeNull();
  });
});
