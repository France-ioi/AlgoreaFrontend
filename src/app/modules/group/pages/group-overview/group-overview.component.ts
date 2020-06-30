import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../../shared/http-services/group.service';
import { Group } from '../../../../shared/models/group.model';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.scss']
})
export class GroupOverviewComponent implements OnInit {

  group: Group = new Group();

  tasks = [];

  columns = [
    { field: 'task', header: 'Task' },
    { field: 'chapter', header: 'Chapter' },
    { field: 'grade', header: 'Grade' },
    { field: 'date', header: 'Date' }
  ];

  panels = [
  ];

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.panels.push(
      {
        name: 'Group',
        columns: this.columns
      }
    );
    this.groupService.getLatestGroup().subscribe(group => {
      this.group = group;
    });
  }

  onExpandWidth(_e) {

  }

}
