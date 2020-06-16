import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityPickerComponent } from './activity-picker.component';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

describe('ActivityPickerComponent', () => {
  let component: ActivityPickerComponent;
  let fixture: ComponentFixture<ActivityPickerComponent>;

  beforeEach(async(() => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule
      ],
      declarations: [ ActivityPickerComponent ],
      providers: [
        {
          provide: MatDialog,
          useValue: dialogSpy
        }
      ]
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
