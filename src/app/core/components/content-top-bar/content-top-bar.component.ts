import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { combineLatest, map, Observable, of } from 'rxjs';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { delay, switchMap, filter, distinctUntilChanged } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { isItemInfo } from '../../../shared/models/content/item-info';
import { FullFrameContent } from 'src/app/shared/services/layout.service';
import { GroupWatchingService } from '../../services/group-watching.service';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { isGroupInfo } from '../../../shared/models/content/group-info';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent implements OnDestroy {
  @Input() fullFrameContent?: FullFrameContent;
  @Input() scrolled = false;

  @ViewChild('op') op?: OverlayPanel;

  discussionState$ = this.discussionService.state$;

  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  currentContent$: Observable<ContentInfo | null> = this.currentContentService.content$.pipe(
    delay(0),
  );

  navigationNeighbors$ = this.currentContentService.content$.pipe(
    switchMap(content => {
      if (isGroupInfo(content)) {
        return this.groupNavTreeService.navigationNeighbors$;
      }

      if (!isItemInfo(content) || !content.route?.contentType) {
        return of(undefined);
      }

      return content.route.contentType === 'activity' ?
        this.activityNavTreeService.navigationNeighbors$ : this.skillNavTreeService.navigationNeighbors$;
    }),
    filter(navigationNeighbors => !!navigationNeighbors?.isReady),
  );

  allowWatchingGroup$ = this.currentContent$.pipe(
    map(currentContent => isGroupInfo(currentContent) && currentContent.currentUserCanWatchMembers),
  );

  isCurrentGroupWatched$ = combineLatest([
    this.groupWatchingService.watchedGroup$,
    this.currentContent$.pipe(filter(isGroupInfo)),
  ]).pipe(
    map(([ watchedGroup, group ]) => !!(watchedGroup && watchedGroup.route.id === group.route.id)),
  );

  subscription = this.currentContent$.pipe(
    distinctUntilChanged((prevCurrentContent, currentContent) =>
      prevCurrentContent?.route?.id === currentContent?.route?.id
    ),
  ).subscribe(() => {
    if (this.op?.overlayVisible) {
      this.op?.hide();
    }
  });

  constructor(
    private groupWatchingService: GroupWatchingService,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private discussionService: DiscussionService
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleThreadVisibility(visible: boolean): void {
    this.discussionService.toggleVisibility(visible);
  }

  toggleWatchingMode(event: Event, contentInfo: ContentInfo, isWatching: boolean): void {
    if (!isGroupInfo(contentInfo)) {
      throw new Error('Unexpected: content is not a group');
    }

    if (isWatching) {
      this.op?.hide();
      this.groupWatchingService.stopWatching();
      return;
    }

    this.groupWatchingService.startGroupWatching(contentInfo.route, {
      id: contentInfo.route.id,
      name: contentInfo.title || '',
      currentUserCanGrantGroupAccess: !!contentInfo.currentUserCanGrantGroupAccess,
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
