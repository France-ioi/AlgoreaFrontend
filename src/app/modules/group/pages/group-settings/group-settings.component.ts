import { Component } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupTabService } from '../../services/group-tab.service';
import { canCurrentUserManageGroup } from '../../helpers/group';

@Component({
  selector: 'alg-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.scss']
})
export class GroupSettingsComponent {

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
