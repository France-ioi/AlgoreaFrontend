import { Component, ViewChild } from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { GroupWatchingService } from '../../../../core/services/group-watching.service';
import { combineLatest, map } from 'rxjs';
import { CurrentContentService } from '../../../../shared/services/current-content.service';
import { GroupInfo, isGroupInfo } from '../../../../shared/models/content/group-info';
import { SuggestionOfActivitiesComponent } from '../suggestion-of-activities/suggestion-of-activities.component';
import { ButtonModule } from 'primeng/button';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-watch-button',
  templateUrl: './watch-button.component.html',
  styleUrls: [ './watch-button.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ButtonModule,
    NgClass,
    OverlayPanelModule,
    SuggestionOfActivitiesComponent,
    AsyncPipe,
  ],
})
export class WatchButtonComponent {
  @ViewChild('op') op?: OverlayPanel;

  currentGroupContent$ = combineLatest([
    this.currentContentService.content$,
    this.groupWatchingService.watchedGroup$,
  ]).pipe(
    map(([ currentContent, watchedGroup ]) => (isGroupInfo(currentContent) ? {
      ...currentContent,
      isBeingWatched: currentContent.route.id === watchedGroup?.route.id,
    } : undefined)),
  );

  constructor(private currentContentService: CurrentContentService, private groupWatchingService: GroupWatchingService) {
  }

  toggleWatchingMode(event: Event, groupInfo: GroupInfo & {isBeingWatched: boolean}): void {
    if (groupInfo.isBeingWatched) {
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
