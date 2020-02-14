import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridFilterBarComponent } from './grid-filter-bar.component';

describe('GridFilterBarComponent', () => {
  let component: GridFilterBarComponent;
  let fixture: ComponentFixture<GridFilterBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridFilterBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridFilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
