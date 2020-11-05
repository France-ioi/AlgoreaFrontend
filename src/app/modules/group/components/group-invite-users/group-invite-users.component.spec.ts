import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { CreateGroupInvitationsService } from '../../http-services/create-group-invitations.service';

import { GroupInviteUsersComponent } from './group-invite-users.component';

describe('GroupInviteUsersComponent', () => {
  let component: GroupInviteUsersComponent;
  let fixture: ComponentFixture<GroupInviteUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupInviteUsersComponent ],
      providers: [
        { provide: MessageService, useValue: { add: (_m: any) => {} } },
        { provide: CreateGroupInvitationsService, useValue: {} },
      ]
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
