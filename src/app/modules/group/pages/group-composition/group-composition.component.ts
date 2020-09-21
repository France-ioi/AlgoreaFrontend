import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: ['./group-composition.component.scss']
})
export class GroupCompositionComponent {

  group$ = this.groupTabService.group$.pipe(map((g) => withManagementAdditions(g)));

  constructor(
    private groupTabService: GroupTabService,
  ) {}

  refreshGroupInfo() {
    this.groupTabService.requestGroupRefresh();
  }

}
