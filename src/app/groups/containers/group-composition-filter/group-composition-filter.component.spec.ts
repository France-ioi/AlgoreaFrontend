import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Filter, GroupCompositionFilterComponent, TypeFilter } from './group-composition-filter.component';

describe('GroupCompositionFilterComponent', () => {
  let component: GroupCompositionFilterComponent;
  let fixture: ComponentFixture<GroupCompositionFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GroupCompositionFilterComponent ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupCompositionFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('setFilter', () => {
    it('should sync derived state from the given filter', () => {
      const filter: Filter = { type: TypeFilter.Groups, directChildren: false };

      component.setFilter(filter);

      expect(component.value()).toEqual(filter);
      expect(component.allDescendantsChecked()).toBe(true);
      expect(component.selectedTypeFilter()).toBe(0);
      expect(component.allowToCheckAllDescendants()).toBe(false);
    });
  });

  describe('change output', () => {
    it('should emit a new object reference on type filter change', () => {
      const emitted: Filter[] = [];
      component.change.subscribe(value => emitted.push(value));
      const before = component.value();

      component.onTypeFilterChanged(0);

      expect(emitted.length).toBe(1);
      expect(emitted[0]).not.toBe(before);
      expect(emitted[0]).toEqual({ type: TypeFilter.Groups, directChildren: true });
    });
  });
});
