import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { JoinGroupDialogComponent } from 'src/app/basic-component/dialogs/join-group-dialog/join-group-dialog.component';
import { CurrentUserService } from 'src/app/shared/services/api/current-user.service';
import { MembershipHistory } from 'src/app/shared/models/membership-history.model';
import { GroupMembership } from 'src/app/shared/models/group-membership.model';
import { GroupService } from 'src/app/shared/services/api/group.service';
import { GroupMember } from 'src/app/shared/models/group-member.model';

@Component({
  selector: 'app-group-joined',
  templateUrl: './group-joined.component.html',
  styleUrls: ['./group-joined.component.scss']
})
export class GroupJoinedComponent implements OnInit {

  teamData = [];

  teamColumns = [
    { field: 'title', header: 'title' },
    { field: 'members', header: 'members' },
    { field: 'related_to', header: 'related to' },
    { field: 'created_the', header: 'created the' }
  ];

  teamPanel = [
    {
      name: 'Team Info',
      columns: this.teamColumns
    }
  ];

  invitationData = [];

  invitationColumns = [
    { field: 'title', header: 'title' },
    { field: 'type', header: 'type' },
    { field: 'date', header: 'entry date' },
    { field: 'admins', header: 'admins' }
  ]

  invitationPanel = [
    {
      name: 'Invitation Info',
      columns: this.invitationColumns
    }
  ];

  constructor(
    public dialog: MatDialog,
    private currentUserService: CurrentUserService,
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.currentUserService.getPendingInvitations().subscribe((memberships: MembershipHistory []) => {
      for (const membership of memberships) {
        if (membership.action !== 'invitation_created') {
          continue;
        }

        this.invitationData.push({
          title: membership.group.name,
          type: membership.group.type,
          date: membership.at,
          admins: 'Mathias'
        });
      }
    });

    this.currentUserService.getJoinedGroups().subscribe((memberships: GroupMembership []) => {
      for (const membership of memberships) {

        // this.groupService.getGroupMembers(membership.group.id).subscribe((mbrs: GroupMember []) => {
        //   this.teamData.push({
        //     title: membership.group.name,
        //     created_the: membership.group.type,
        //     related_to: membership.action,
        //     members: mbrs.map(val => val.user.login).join(', ')
        //   });
        // });

        this.teamData.push({
          title: membership.group.name,
          created_the: membership.group.type,
          related_to: membership.action,
          members: 'Mathias'
        });
      }
    });
  }

  onExpandWidth(e) {
    
  }

  onJoinTeam(code) {
    const dialogRef = this.dialog.open(JoinGroupDialogComponent, {
      maxHeight: '83rem',
      minWidth: '50rem',
      maxWidth: '50rem',
      minHeight: '17rem',
      data: {
        group_name: 'Terminale A',
        desc: 'Group presentation Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
        administrators: [
          'Mathias HIRON',
          'Melanie STORUP',
          'Jean LUCAS'
        ],
        require_watch_approval: true,
        require_personal_info_access_approval: 'edit',
        require_lock_membership_approval_until: new Date()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Main dialog returns ${result}`);
      if (result.success) {
        this.currentUserService.joinGroupByCode(code, ['personal_info_view']).subscribe(res => {
          console.log(res);
        })
      }
    });
  }

  onClickLeaveTeam(e) {
    this.currentUserService.leaveGroup(11).subscribe(res => {
      console.log(res);
    });
  }

}
