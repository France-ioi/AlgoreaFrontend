import { Component, OnInit, Input } from '@angular/core';
import { GroupService } from 'src/app/shared/services/api/group.service';
import { GroupPendingRequest } from 'src/app/shared/models/group-pending-request.model';
import { GroupMember } from 'src/app/shared/models/group-member.model';
import { SortEvent } from 'primeng/api/sortevent';

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
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'user.login', header: 'User name' },
    { field: 'user.grade', header: 'Grade' },
    { field: 'member_since', header: 'Member Since' },
  ];
  multiSortMeta = [
    { field: 'id', order: 1 },
    { field: 'member_since', order: -1 }
  ];
  memberPanel = [
    {
      name: 'Group Info',
      columns: this.memberCols
    }
  ]

  trees;

  pendingReqs: GroupPendingRequest[];

  private _setMemberData(members: GroupMember []) {
    this.memberData = [];

    for( const member of members ) {
      this.memberData.push({
        member_since: member.member_since,
        name: `${member.user.first_name} ${member.user.last_name}`,
        'user.login': member.user.login,
        'user.grade': member.user.grade,
        id: member.id
      })
    }
  }

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
      this._setMemberData(members);
    });
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

  onSort(event: SortEvent) {
    console.log(event);
    const sortBy = event.multiSortMeta.map(meta => {
      return meta.order === -1 ? `-${meta.field}` : meta.field
    });

    this.groupService.getGroupMembers(51, sortBy).subscribe((members: GroupMember[]) => {
      this._setMemberData(members);
    });
  }

}
