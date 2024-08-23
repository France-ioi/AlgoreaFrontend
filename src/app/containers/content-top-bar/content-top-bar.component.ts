import { Component, Input } from '@angular/core';
import { ContentInfo } from '../../models/content/content-info';
import { Observable, of } from 'rxjs';
import { CurrentContentService } from '../../services/current-content.service';
import { delay, switchMap, filter } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { isItemInfo } from '../../models/content/item-info';
import { LayoutService } from '../../services/layout.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { isGroupInfo } from '../../models/content/group-info';
import { NeighborWidgetComponent } from '../../ui-components/neighbor-widget/neighbor-widget.component';
import { ObservationBarWithButtonComponent } from '../observation-bar-with-button/observation-bar-with-button.component';
import { TabBarComponent } from '../../ui-components/tab-bar/tab-bar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { LetDirective, PushPipe } from '@ngrx/component';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { ButtonModule } from 'primeng/button';
import { NgIf, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { TabService } from '../../services/tab.service';
import { TimeLimitedContentInfoComponent } from '../time-limited-content-info/time-limited-content-info.component';

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
    TimeLimitedContentInfoComponent,
    NeighborWidgetComponent,
    AsyncPipe,
    PushPipe,
  ],
})
export class ContentTopBarComponent {
  @Input() showBreadcrumbs = true;
  @Input() showLeftMenuOpener = false;

  hasForumThreadConfigured$ = this.store.select(fromForum.selectHasCurrentThread);

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
    private store: Store,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
    private layoutService: LayoutService,
    private tabService: TabService,
  ) {}

  toggleDiscussionPanelVisibility(): void {
    this.store.dispatch(fromForum.topBarActions.toggleCurrentThreadVisibility());
  }

  showLeftMenu(): void {
    this.layoutService.toggleLeftMenu(true);
  }
}
