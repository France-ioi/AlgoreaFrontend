import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { LayoutService } from '../../services/layout.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { NeighborWidgetComponent } from '../../ui-components/neighbor-widget/neighbor-widget.component';
import { TabBarComponent } from '../../ui-components/tab-bar/tab-bar.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { LetDirective, PushPipe } from '@ngrx/component';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { TabService } from '../../services/tab.service';
import { TimeLimitedContentInfoComponent } from '../time-limited-content-info/time-limited-content-info.component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { selectActiveItemDisplayedScore } from 'src/app/items/models/scores';
import { fromItemContent } from 'src/app/items/store';
import { isGroupRoute } from 'src/app/models/routing/group-route';
import { isItemRoute } from 'src/app/models/routing/item-route';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
  imports: [
    NgIf,
    ScoreRingComponent,
    LetDirective,
    BreadcrumbsComponent,
    TabBarComponent,
    ObservationBarComponent,
    TimeLimitedContentInfoComponent,
    NeighborWidgetComponent,
    AsyncPipe,
    PushPipe,
    ButtonIconComponent,
  ]
})
export class ContentTopBarComponent {
  @Input() showBreadcrumbs = true;
  @Input() showLeftMenuOpener = false;

  hasForumThreadConfigured$ = this.store.select(fromForum.selectHasCurrentThread);

  isItemContentActive = this.store.selectSignal(fromItemContent.selectIsItemContentActive);
  title = this.store.selectSignal(fromCurrentContent.selectTitle);
  score = this.store.selectSignal(selectActiveItemDisplayedScore);

  navigationNeighbors$ = this.store.select(fromCurrentContent.selectContentRoute).pipe(
    switchMap(contentRoute => {
      if (!contentRoute) return of(undefined);

      if (isGroupRoute(contentRoute)) return this.groupNavTreeService.navigationNeighbors$;
      if (isItemRoute(contentRoute)) {
        return contentRoute.contentType === 'activity' ?
          this.activityNavTreeService.navigationNeighbors$ : this.skillNavTreeService.navigationNeighbors$;
      }
      return of(undefined);
    }),
  );
  readonly fullFrameContentDisplayed$ = this.layoutService.fullFrameContentDisplayed$;
  readonly isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  readonly shouldDisplayTabBar$ = this.tabService.shouldDisplayTabBar$;

  constructor(
    private store: Store,
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
