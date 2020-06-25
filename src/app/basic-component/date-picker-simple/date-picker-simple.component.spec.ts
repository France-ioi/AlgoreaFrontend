import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePickerSimpleComponent } from './date-picker-simple.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DatePickerSimpleComponent', () => {
  let component: DatePickerSimpleComponent;
  let fixture: ComponentFixture<DatePickerSimpleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatePickerSimpleComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatePickerSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
