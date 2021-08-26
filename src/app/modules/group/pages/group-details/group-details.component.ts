import { Component, ViewChild } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { RouterLinkActive } from '@angular/router';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: [ './group-details.component.scss' ],
})
export class GroupDetailsComponent {

  state$ = this.groupDataSource.state$.pipe(mapStateData(state => ({
    group: withManagementAdditions(state.group),
    path: state.route.path,
  })));
  fullFrameContent$ = this.layoutService.fullFrameContent$;

  // use of ViewChild required as these elements are shown under some conditions, so may be undefined
  @ViewChild('overviewTab') overviewTab?: RouterLinkActive;
  @ViewChild('compositionTab') compositionTab?: RouterLinkActive;
  @ViewChild('adminTab') adminTab?: RouterLinkActive;
  @ViewChild('settingsTab') settingsTab?: RouterLinkActive;

  constructor(
    private groupDataSource: GroupDataSource,
    private layoutService: LayoutService,
  ) {}

  onGroupRefreshRequired(): void {
    this.groupDataSource.refetchGroup();
  }
}
