import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetGroupManagersService, Manager } from '../../http-services/get-group-managers.service';

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: ['./group-manager-list.component.scss']
})
export class GroupManagerListComponent implements OnChanges {

  @Input() group: Group;

  managers: Manager[] = [];

  constructor(private getGroupManagersService:GetGroupManagersService) {}


  ngOnChanges(_changes: SimpleChanges) {
    this.reloadData();
  }

  private reloadData() {
    this.getGroupManagersService
      .getGroupManagers(this.group.id,)
      .subscribe((managers: Manager[]) => {
        this.managers = managers;
      });
  }
}
