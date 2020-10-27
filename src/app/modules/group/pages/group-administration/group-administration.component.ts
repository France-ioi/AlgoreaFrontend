import { Component } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-group-administration',
  templateUrl: './group-administration.component.html',
  styleUrls: [ './group-administration.component.scss' ]
})
export class GroupAdministrationComponent {

  state$ = this.groupDataSource.state$;
  group$ = this.groupDataSource.group$.pipe(map(withManagementAdditions));

  constructor(
    private groupDataSource: GroupDataSource,
  ) {}

  refreshGroupInfo() {
    this.groupDataSource.refetchGroup();
  }
}
