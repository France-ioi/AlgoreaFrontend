import { Component, Input } from '@angular/core';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { Observable, of } from 'rxjs';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { delay, switchMap, filter } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { isItemInfo } from '../../../shared/models/content/item-info';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { GroupWatchingService } from '../../services/group-watching.service';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { isGroupInfo } from '../../../shared/models/content/group-info';
import { TabService } from '../../../shared/services/tab.service';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent {
  @Input() showBreadcrumbs = true;
  @Input() showLeftMenuOpener = false;

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
  readonly fullFrameContentDisplayed$ = this.layoutService.fullFrameContentDisplayed$;
  readonly isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  readonly shouldDisplayTabBar$ = this.tabService.shouldDisplayTabBar$;

  constructor(
    private groupWatchingService: GroupWatchingService,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private discussionService: DiscussionService,
    private layoutService: LayoutService,
    private tabService: TabService,
  ) {}

  toggleThreadVisibility(visible: boolean): void {
    this.discussionService.toggleVisibility(visible);
  }

  showLeftMenu(): void {
    this.layoutService.toggleLeftMenu(true);
  }
}
