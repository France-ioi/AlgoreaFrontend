import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupInviteUsersComponent } from './group-invite-users.component';

describe('GroupInviteUsersComponent', () => {
  let component: GroupInviteUsersComponent;
  let fixture: ComponentFixture<GroupInviteUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupInviteUsersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupInviteUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
