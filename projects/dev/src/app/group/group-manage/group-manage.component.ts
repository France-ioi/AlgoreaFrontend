import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StatusService } from '../../shared/services/status.service';
import { GroupService } from '../../shared/services/api/group.service';
import { Group } from '../../shared/models/group.model';

@Component({
  selector: 'app-group-manage',
  templateUrl: './group-manage.component.html',
  styleUrls: ['./group-manage.component.scss']
})
export class GroupManageComponent implements OnInit {

  groupdata = {};
  status;

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusService: StatusService,
    private groupService: GroupService
  ) { }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.params.id;

    console.log(id);

    this.groupService.getManagedGroup(id).subscribe((group: Group) => {
      this.groupdata = {
        ID: group.id,
        name: group.name,
        type: group.type,
        grades: [group.grade],
        date: group.created_at
      };
    });

    this.statusService.getObservable().subscribe(res => {
      this.status = res;
    });
  }

}
