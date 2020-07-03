import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePickerSharedComponent } from './date-picker-simple.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DatePickerSharedComponent', () => {
  let component: DatePickerSharedComponent;
  let fixture: ComponentFixture<DatePickerSharedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatePickerSharedComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatePickerSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
