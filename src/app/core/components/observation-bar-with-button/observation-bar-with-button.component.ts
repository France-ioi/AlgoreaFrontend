import { Component, OnDestroy, ViewChild } from '@angular/core';
import { GroupWatchingService } from '../../services/group-watching.service';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { LayoutService } from '../../../shared/services/layout.service';
import { combineLatest, map } from 'rxjs';
import { GroupInfo, isGroupInfo } from '../../../shared/models/content/group-info';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import {
  SuggestionOfActivitiesComponent
} from '../../../modules/shared-components/components/suggestion-of-activities/suggestion-of-activities.component';
import { ButtonModule } from 'primeng/button';
import { LetDirective } from '@ngrx/component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-observation-bar-with-button',
  templateUrl: 'observation-bar-with-button.component.html',
  styleUrls: [ './observation-bar-with-button.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ObservationBarComponent,
    LetDirective,
    ButtonModule,
    NgClass,
    OverlayPanelModule,
    SuggestionOfActivitiesComponent,
    AsyncPipe,
  ],
})
export class ObservationBarWithButtonComponent implements OnDestroy {
  @ViewChild('op') op?: OverlayPanel;

  currentContent$ = this.currentContentService.content$;
  watchedGroup$ = this.groupWatchingService.watchedGroup$;
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  currentGroupContent$ = combineLatest([
    this.currentContent$,
    this.watchedGroup$,
  ]).pipe(
    map(([ currentContent, watchedGroup ]) => (isGroupInfo(currentContent) && currentContent.details?.currentUserCanWatchMembers ? {
      ...currentContent,
      isBeingWatched: currentContent.route.id === watchedGroup?.route.id,
    } : undefined)),
  );

  subscription = this.watchedGroup$.subscribe(watchedGroup => {
    if (!watchedGroup && this.op?.overlayVisible) {
      this.op.hide();
    }
  });

  constructor(
    private groupWatchingService: GroupWatchingService,
    private layoutService: LayoutService,
    private currentContentService: CurrentContentService,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openSuggestionOfActivitiesOverlayPanel(event: Event, target: HTMLDivElement): void {
    this.op?.show(event, target);
    // Align method needs to be called because top banner of observing group
    // changes position of the page and as result we have a bug with wrong tooltip positioning.
    // Async function/wrapper setTimeout - guarantees to call align method after position of page changed
    setTimeout(() => {
      this.op?.align();
    });
  }

  toggleWatchingMode(event: Event, target: HTMLDivElement, groupInfo: GroupInfo & {isBeingWatched: boolean}): void {
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
    this.openSuggestionOfActivitiesOverlayPanel(event, target);
  }
}
