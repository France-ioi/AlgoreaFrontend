import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePickerSimpleComponent } from './date-picker-simple.component';

describe('DatePickerSimpleComponent', () => {
  let component: DatePickerSimpleComponent;
  let fixture: ComponentFixture<DatePickerSimpleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatePickerSimpleComponent ]
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
