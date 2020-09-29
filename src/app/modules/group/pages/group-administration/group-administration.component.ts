import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-group-administration',
  templateUrl: './group-administration.component.html',
  styleUrls: ['./group-administration.component.scss']
})
export class GroupAdministrationComponent {

  group$ = this.groupTabService.group$.pipe(map((g) => withManagementAdditions(g)));

  constructor(
    private groupTabService: GroupTabService,
  ) {}

  refreshGroupInfo() {
    this.groupTabService.requestGroupRefresh();
  }
}
