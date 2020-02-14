import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridFilterComponent } from './grid-filter.component';

describe('GridFilterComponent', () => {
  let component: GridFilterComponent;
  let fixture: ComponentFixture<GridFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
