import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityPickerComponent } from './activity-picker.component';

describe('ActivityPickerComponent', () => {
  let component: ActivityPickerComponent;
  let fixture: ComponentFixture<ActivityPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivityPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
