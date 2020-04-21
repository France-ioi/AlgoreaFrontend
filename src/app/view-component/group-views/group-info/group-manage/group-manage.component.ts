import { Component, OnInit, Input } from '@angular/core';
import { NodeService } from 'src/app/shared/services/node-service.service';
import { GroupService } from 'src/app/shared/services/api/group.service';
import { GroupPendingRequest } from 'src/app/shared/models/group-pending-request.model';
import { GroupMember } from 'src/app/shared/models/group-member.model';

@Component({
  selector: 'app-group-manage',
  templateUrl: './group-manage.component.html',
  styleUrls: ['./group-manage.component.scss']
})
export class GroupManageComponent implements OnInit {

  requests = [];
  columns = [
    { field: 'user', header: 'user' },
    { field: 'date', header: 'requested on' }
  ];
  panel = [
    {
      name: 'Epreuves',
      columns: this.columns
    }
  ];

  memberData = [];
  memberCols = [
    { field: 'name', header: 'Name' },
    { field: 'login', header: 'User name' },
    { field: 'grade', header: 'Grade' },
    { field: 'member_since', header: 'Member Since' },
  ];
  memberPanel = [
    {
      name: 'Group Info',
      columns: this.memberCols
    }
  ]

  trees;

  pendingReqs: GroupPendingRequest[];

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.groupService.getManagedRequests(50).subscribe((reqs: GroupPendingRequest[]) => {
      this.pendingReqs = reqs;
      for( const req of reqs ) {
        this.requests.push({
          user: {
            image: 'assets/images/_messi.jpg',
            name: `${req.joining_user.first_name || ''} ${req.joining_user.last_name || ''} (${req.joining_user.login || ''})`,
            activity: 'Terminale',
            content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
          },
          date: req.at
        })
      }
    });

    this.groupService.getGroupMembers(51).subscribe((members: GroupMember[]) => {
      for( const member of members ) {
        this.memberData.push({
          member_since: member.member_since,
          name: `${member.user.first_name} ${member.user.last_name}`,
          login: member.user.login,
          grade: member.user.grade,
          id: member.id
        })
      }
    })
  }

  onAcceptRequest(e) {
    this.groupService.acceptJoinRequest(50, this.pendingReqs.map(val => val.member_id)).subscribe(res => {
      console.log(res);
    });
  }

  onRejectRequest(e) {
    this.groupService.rejectJoinRequest(50, this.pendingReqs.map(val => val.member_id)).subscribe(res => {
      console.log(res);
    });
  }

  onRemoveMember(selected) {
    const ids = selected.map(val => val.id);
    this.groupService.removeGroupMembers(51, ids).subscribe(res => {
      let newMemberData = [];
      for (const member of this.memberData) {
        if (ids.indexOf(member.id) < 0) {
          newMemberData.push(member);
        }
      }

      this.memberData = newMemberData;
    });
  }

  onExpandWidth(e) {
    
  }

}
