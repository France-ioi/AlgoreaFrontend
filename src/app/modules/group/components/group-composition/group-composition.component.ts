import { Component, OnInit } from '@angular/core';
import { Group } from '../../../../shared/models/group.model';
import { GroupService } from '../../../../shared/http-services/group.service';

@Component({
  selector: 'alg-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: ['./group-composition.component.scss']
})
export class GroupCompositionComponent implements OnInit {

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
