import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubGridComponent } from './sub-grid.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SubGridComponent', () => {
  let component: SubGridComponent;
  let fixture: ComponentFixture<SubGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubGridComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
