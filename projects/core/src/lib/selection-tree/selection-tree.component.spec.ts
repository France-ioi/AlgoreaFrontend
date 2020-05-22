import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionTreeComponent } from './selection-tree.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SelectionTreeComponent', () => {
  let component: SelectionTreeComponent;
  let fixture: ComponentFixture<SelectionTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectionTreeComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
