import { Component, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { GroupWatchingService } from '../../../../core/services/group-watching.service';
import { combineLatest, map } from 'rxjs';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { filter } from 'rxjs/operators';
import { GroupInfo, isGroupInfo } from '../../../../shared/models/content/group-info';

@Component({
  selector: 'alg-watch-button',
  templateUrl: './watch-button.component.html',
  styleUrls: [ './watch-button.component.scss' ],
})
export class WatchButtonComponent {
  @ViewChild('op') op?: OverlayPanel;

  groupInfo$ = this.currentContentService.content$.pipe(
    filter(isGroupInfo),
  );
  isCurrentGroupWatched$ = combineLatest([
    this.groupWatchingService.watchedGroup$,
    this.groupInfo$,
  ]).pipe(
    map(([ watchedGroup, groupInfo ]) => !!(watchedGroup && watchedGroup.route.id === groupInfo.route.id)),
  );

  constructor(private currentContentService: CurrentContentService, private groupWatchingService: GroupWatchingService) {
  }

  toggleWatchingMode(event: Event, groupInfo: GroupInfo, isWatching: boolean): void {
    if (isWatching) {
      this.op?.hide();
      this.groupWatchingService.stopWatching();
      return;
    }

    if (!groupInfo.details) {
      throw new Error('Unexpected: group details in not set');
    }

    this.groupWatchingService.startGroupWatching(groupInfo.route, {
      id: groupInfo.route.id,
      name: groupInfo.details.name,
      currentUserCanGrantGroupAccess: groupInfo.details.currentUserCanGrantGroupAccess,
    });
    this.openSuggestionOfActivitiesOverlayPanel(event);
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
