import { Component, Input } from '@angular/core';
import { ContentInfo } from '../../models/content/content-info';
import { Observable, of } from 'rxjs';
import { CurrentContentService } from '../../services/current-content.service';
import { delay, switchMap, filter } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { isItemInfo } from '../../models/content/item-info';
import { LayoutService } from '../../services/layout.service';
import { GroupWatchingService } from '../../services/group-watching.service';
import { DiscussionService } from '../../services/discussion.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { isGroupInfo } from '../../models/content/group-info';
import { ThreadId } from '../../services/threads.service';
import { NeighborWidgetComponent } from '../../ui-components/neighbor-widget/neighbor-widget.component';
import { ObservationBarWithButtonComponent } from '../observation-bar-with-button/observation-bar-with-button.component';
import { TabBarComponent } from '../../ui-components/tab-bar/tab-bar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { LetDirective } from '@ngrx/component';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { ButtonModule } from 'primeng/button';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ButtonModule,
    ScoreRingComponent,
    LetDirective,
    BreadcrumbComponent,
    TabBarComponent,
    ObservationBarWithButtonComponent,
    NeighborWidgetComponent,
    AsyncPipe,
  ],
})
export class ContentTopBarComponent {
  @Input() showBreadcrumbs = true;
  @Input() showLeftMenuOpener = false;

  configuredThread$ = this.discussionService.configuredThread$;
  isDiscussionVisible$ = this.discussionService.visible$;
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

  constructor(
    private groupWatchingService: GroupWatchingService,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private discussionService: DiscussionService,
    private layoutService: LayoutService,
  ) {}

  toggleDiscussionPanelVisibility(visible: boolean, thread: ThreadId): void {
    this.discussionService.toggleVisibility(visible, visible ? thread : undefined);
  }

  showLeftMenu(): void {
    this.layoutService.toggleLeftMenu(true);
  }
}
