import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Duration } from '../../../../shared/helpers/duration';

import { TimePickerComponent } from './time-picker.component';
import { FormsModule } from '@angular/forms';

describe('TimePickerComponent', () => {
  let component: TimePickerComponent;
  let fixture: ComponentFixture<TimePickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
      ],
      declarations: [ TimePickerComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimePickerComponent);
    component = fixture.componentInstance;
    component.initialValue = new Duration(60);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
