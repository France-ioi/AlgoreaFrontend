import { Component, Input, OnChanges } from '@angular/core';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { filter, map } from 'rxjs/operators';
import { isNotNullOrUndefined } from 'src/app/shared/helpers/null-undefined-predicates';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent implements OnChanges {
  @Input() group?: Group;

  groupWithManagement?: Group & ManagementAdditions;
  isCurrentGroupWatched$ = this.userSessionService.session$.pipe(
    filter(isNotNullOrUndefined),
    map(data => !!(data.watchedGroup && data.watchedGroup.id === this.group?.id)),
  );

  constructor(
    private modeService: ModeService,
    private userSessionService: UserSessionService,
  ) {}

  ngOnChanges(): void {
    this.groupWithManagement = this.group ? withManagementAdditions(this.group) : undefined;
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

  onStartWatchButtonClicked(): void {
    if (!this.group) throw new Error("unexpected group not set in 'onWatchButtonClicked'");
    this.modeService.startObserving(this.group);
  }

  onStopWatchButtonClicked(): void {
    this.modeService.stopObserving();
  }
}
