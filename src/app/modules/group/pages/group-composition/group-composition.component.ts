import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { canCurrentUserManageMembers } from '../../helpers/group-management';

@Component({
  selector: 'alg-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: ['./group-composition.component.scss']
})
export class GroupCompositionComponent {

  group: Group
  canCurrentUserManageMembers = false

  constructor(
    private groupTabService: GroupTabService,
  ) {
    this.groupTabService.group$.subscribe((g: Group) => {
      this.group = g;
      this.canCurrentUserManageMembers = canCurrentUserManageMembers(g);
    });
  }

  refreshGroupInfo() {
    this.groupTabService.refresh$.next();
  }

}
