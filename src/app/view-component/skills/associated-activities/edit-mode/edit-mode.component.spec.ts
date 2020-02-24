import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedActivitiesEditModeComponent } from './edit-mode.component';

describe('AssociatedActivitiesEditModeComponent', () => {
  let component: AssociatedActivitiesEditModeComponent;
  let fixture: ComponentFixture<AssociatedActivitiesEditModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssociatedActivitiesEditModeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociatedActivitiesEditModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
