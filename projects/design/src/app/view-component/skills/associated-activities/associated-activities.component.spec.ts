import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedActivitiesComponent } from './associated-activities.component';

describe('AssociatedActivitiesComponent', () => {
  let component: AssociatedActivitiesComponent;
  let fixture: ComponentFixture<AssociatedActivitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssociatedActivitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociatedActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
