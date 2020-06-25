import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateTimePickerComponent } from './date-time-picker.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DateTimePickerComponent', () => {
  let component: DateTimePickerComponent;
  let fixture: ComponentFixture<DateTimePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DateTimePickerComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
