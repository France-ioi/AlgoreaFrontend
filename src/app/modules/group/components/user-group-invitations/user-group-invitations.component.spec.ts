import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserGroupInvitationsComponent } from './user-group-invitations.component';

describe('UserGroupInvitationsComponent', () => {
  let component: UserGroupInvitationsComponent;
  let fixture: ComponentFixture<UserGroupInvitationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserGroupInvitationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserGroupInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
