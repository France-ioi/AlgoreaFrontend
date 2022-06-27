import { Component, Input, ViewChild } from '@angular/core';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { map, Observable, of } from 'rxjs';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { delay, switchMap, filter } from 'rxjs/operators';
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
export class ContentTopBarComponent {
  @Input() fullFrameContent?: FullFrameContent;
  @Input() scrolled = false;

  @ViewChild('op') op?: OverlayPanel;

  discussionState$ = this.discussionService.state$;

  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  currentContent$: Observable<ContentInfo | null> = this.currentContentService.content$.pipe(
    delay(0),
  );

  groupInfo$ = this.currentContentService.content$.pipe(
    filter(isGroupInfo),
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

  constructor(
    private groupWatchingService: GroupWatchingService,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private discussionService: DiscussionService
  ) {}

  toggleThreadVisibility(visible: boolean): void {
    this.discussionService.toggleVisibility(visible);
  }

}
