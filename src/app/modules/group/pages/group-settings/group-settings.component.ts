import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.scss']
})
export class GroupSettingsComponent {

  group$ = this.groupTabService.group$.pipe(map((g)=>withManagementAdditions(g)));

  constructor(
    private groupTabService: GroupTabService,
  ) {}

}
