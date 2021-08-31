import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GroupRoute, groupRoute } from 'src/app/shared/routing/group-route';
import { GetGroupManagersService, Manager } from '../../http-services/get-group-managers.service';
import { GroupData } from '../../services/group-datasource.service';

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ]
})
export class GroupManagerListComponent implements OnChanges {

  @Input() groupData?: GroupData;

  managers: (Manager & { canManageAsText: string; route: GroupRoute })[] = [];

  state: 'loading' | 'ready' | 'error' = 'loading';

  constructor(private getGroupManagersService: GetGroupManagersService) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  private getManagerLevel(manager: Manager): string {
    switch (manager.canManage) {
      case 'none':
        return $localize`Read-only`;
      case 'memberships':
        return $localize`Memberships`;
      case 'memberships_and_group':
        return $localize`Memberships and group`;
    }
  }

  private reloadData(): void {
    if (!this.groupData) return;
    const { route, group } = this.groupData;
    this.state = 'loading';
    this.getGroupManagersService
      .getGroupManagers(group.id)
      .subscribe({
        next: (managers: Manager[]) => {
          this.managers = managers.map(manager => ({
            ...manager,
            canManageAsText: this.getManagerLevel(manager),
            route: groupRoute(manager.id, [ ...route.path, group.id ]),
          }));
          this.state = 'ready';
        },
        error: _err => {
          this.state = 'error';
        }
      });
  }
}
