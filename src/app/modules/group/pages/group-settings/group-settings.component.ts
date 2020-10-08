import { Component } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.scss']
})
export class GroupSettingsComponent {

  state$ = this.groupDataSource.state$;
  group$ = this.groupDataSource.group$.pipe(map(withManagementAdditions));

  constructor(
    private groupDataSource: GroupDataSource,
  ) {}

}
