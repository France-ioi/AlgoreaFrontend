import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { map } from 'rxjs/operators';
import { OverlayPanel } from 'primeng/overlaypanel';
import { pathAsParameter } from 'src/app/shared/routing/content-route';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent implements OnChanges {
  @Input() group?: Group;
  @Input() path?: string[];

  @ViewChild('op') op?: OverlayPanel;

  groupWithManagement?: Group & ManagementAdditions;
  isCurrentGroupWatched$ = this.userSessionService.watchedGroup$.pipe(
    map(watchedGroup => !!(watchedGroup && watchedGroup.id === this.group?.id)),
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

  onStartWatchButtonClicked(event: Event): void {
    if (!this.group) throw new Error("unexpected group not set in 'onWatchButtonClicked'");
    this.modeService.startObserving({
      ...this.group,
      link: [ '/', 'groups', 'by-id', this.group.id, this.path && pathAsParameter(this.path), 'details' ].filter(Boolean),
    });
    this.openSuggestionOfActivitiesOverlayPanel(event);
  }

  onStopWatchButtonClicked(): void {
    this.modeService.stopObserving();
  }

  openSuggestionOfActivitiesOverlayPanel(event: Event): void {
    this.op?.show(event);

    // Align method needs to be called because top banner of observing group
    // changes position of the page and as result we have a bug with wrong tooltip positioning.
    // Async function/wrapper setTimeout - guarantees to call align method after position of page changed
    setTimeout(() => {
      this.op?.align();
    });
  }
}
