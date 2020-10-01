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

  state: 'loading' | 'ready' | 'error' = 'loading';

  constructor(private getGroupManagersService: GetGroupManagersService) {}


  ngOnChanges(_changes: SimpleChanges) {
    this.reloadData();
  }

  public getManagerLevel(manager: Manager): string {
    switch(manager.can_manage) {
      case 'none':
        return 'Read-only';
      case 'memberships':
        return 'Memberships';
      case 'memberships_and_group':
        return 'Memberships and group';
      }
  }

  private reloadData() {
    this.state = 'loading';
    this.getGroupManagersService
      .getGroupManagers(this.group.id)
      .subscribe((managers: Manager[]) => {
        this.managers = managers;
        this.state = 'ready';
      },
        _err => {
          this.state = 'error';
        });
  }
}
