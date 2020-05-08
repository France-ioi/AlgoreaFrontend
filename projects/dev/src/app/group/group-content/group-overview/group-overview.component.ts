import { Component, OnInit, Input } from '@angular/core';
import { GroupService } from '../../../shared/services/api/group.service';

@Component({
  selector: 'app-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.scss']
})
export class GroupOverviewComponent implements OnInit {

  @Input() group_id;
  @Input() description;

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

  }

  onExpandWidth(e) {

  }

}
