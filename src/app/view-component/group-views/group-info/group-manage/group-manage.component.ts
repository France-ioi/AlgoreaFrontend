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

  gridData;
  grdata;
  grcols;

  trees;

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.groupService.getManagedRequests(50).subscribe((reqs: GroupPendingRequest[]) => {
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

    this.groupService.getGroupMemebers(50).subscribe((members: GroupMember[]) => {
      for( const member of members ) {
        
      }
    })
  }

  onExpandWidth(e) {
    
  }

}
