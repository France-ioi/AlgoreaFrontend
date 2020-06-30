import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { canCurrentUserManageGroup } from '../../helpers/group';

@Component({
  selector: 'alg-group-administration',
  templateUrl: './group-administration.component.html',
  styleUrls: ['./group-administration.component.scss']
})
export class GroupAdministrationComponent {

  group: Group
  isAllowed: boolean

  constructor(
    private groupTabService: GroupTabService,
  ) {
    this.groupTabService.group$.subscribe((g: Group) => {
      this.group = g;
      this.isAllowed = canCurrentUserManageGroup(g);
    });
  }

}
