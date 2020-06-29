import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/http/services/group.service';
import { Group } from '../../../shared/models/group.model';

@Component({
  selector: 'alg-group-administration',
  templateUrl: './group-administration.component.html',
  styleUrls: ['./group-administration.component.scss']
})
export class GroupAdministrationComponent implements OnInit {

  group: Group = new Group();

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.groupService.getLatestGroup().subscribe(group => {
      this.group = group;
    });
  }

}
