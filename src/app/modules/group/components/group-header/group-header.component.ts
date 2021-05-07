import { Component, Input, OnChanges } from '@angular/core';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent implements OnChanges {
  @Input() group?: Group;
  groupWithManagement?: Group & ManagementAdditions;

  constructor(
    private modeService: ModeService,
  ) {}

  ngOnChanges(): void {
    this.groupWithManagement = this.group ? withManagementAdditions(this.group) : undefined;
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

  onWatchButtonClicked(): void {
    if (!this.group) throw new Error("unexpected group not set in 'onWatchButtonClicked'");
    this.modeService.startObserving(this.group);
  }
}
