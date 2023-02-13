import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';
import { OverlayPanel } from 'primeng/overlaypanel';
import { GroupData } from '../../services/group-datasource.service';
import { GroupNavTreeService } from '../../../../core/services/navigation/group-nav-tree.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent implements OnChanges {
  @Input() groupData?: GroupData;

  @ViewChild('op') op?: OverlayPanel;

  groupWithManagement?: Group & ManagementAdditions;

  navigationNeighbors$ = this.groupNavTreeService.navigationNeighbors$;

  constructor(
    private groupWatchingService: GroupWatchingService,
    private groupNavTreeService: GroupNavTreeService,
  ) {}

  ngOnChanges(): void {
    this.groupWithManagement = this.groupData?.group ? withManagementAdditions(this.groupData.group) : undefined;
  }
}
