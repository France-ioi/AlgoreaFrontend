import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Duration } from 'src/app/utils/duration';

import { TimePickerComponent } from './time-picker.component';
import { FormsModule } from '@angular/forms';

describe('TimePickerComponent', () => {
  let component: TimePickerComponent;
  let fixture: ComponentFixture<TimePickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        TimePickerComponent,
      ]
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
