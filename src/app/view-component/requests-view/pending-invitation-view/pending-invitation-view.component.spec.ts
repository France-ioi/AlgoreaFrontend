import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingInvitationViewComponent } from './pending-invitation-view.component';

describe('PendingInvitationViewComponent', () => {
  let component: PendingInvitationViewComponent;
  let fixture: ComponentFixture<PendingInvitationViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingInvitationViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingInvitationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
