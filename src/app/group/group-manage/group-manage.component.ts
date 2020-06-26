import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StatusService } from '../../shared/services/status.service';
import { GroupService } from '../../shared/services/api/group.service';
import { Group } from '../../shared/models/group.model';

@Component({
  selector: 'alg-group-manage',
  templateUrl: './group-manage.component.html',
  styleUrls: ['./group-manage.component.scss'],
})
export class GroupManageComponent implements OnInit {
  group: Group = new Group();
  status;

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
    { field: 'member_since', order: -1 },
  ];
  prevSortMeta = '-member_since id';
  memberPanel = [
    {
      name: 'Group Info',
      columns: this.memberCols,
    },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusService: StatusService,
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id == null) {
        // FIXME: should probably report error
      } else {
        this.group.id = id; // FIXME: strange way to have the subcomponent get an id...
        this.groupService.getGroup(id).subscribe((group: Group) => {
          this.group = group;
        });
      }
    });

    this.statusService.getObservable().subscribe((res) => {
      this.status = res;
    });
  }

  onExpandWidth(_e) {
  }
}
