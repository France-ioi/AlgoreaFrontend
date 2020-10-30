import { Component } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: [ './group-overview.component.scss' ]
})
export class GroupOverviewComponent {

  state$ = this.groupDataSource.state$;
  group$ = this.groupDataSource.group$;

  constructor(
    private groupDataSource: GroupDataSource,
  ) {}

}
