import { Component, computed, inject, input } from '@angular/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { LayoutService } from '../../services/layout.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { NeighborWidgetComponent } from '../../ui-components/neighbor-widget/neighbor-widget.component';
import { TabBarComponent } from '../../ui-components/tab-bar/tab-bar.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { LetDirective } from '@ngrx/component';
import { ScoreRingComponent } from '../../ui-components/score-ring/score-ring.component';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TabService } from '../../services/tab.service';
import { TimeLimitedContentInfoComponent } from '../time-limited-content-info/time-limited-content-info.component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { selectActiveItemDisplayedScore, selectActiveItemNoScore } from 'src/app/items/models/scores';
import { fromItemContent } from 'src/app/items/store';
import { isGroupRoute } from 'src/app/models/routing/group-route';
import { isItemRoute } from 'src/app/models/routing/item-route';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { PlatformLogoComponent } from 'src/app/ui-components/platform-logo/platform-logo.component';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrl: './content-top-bar.component.scss',
  imports: [
    ScoreRingComponent,
    LetDirective,
    BreadcrumbsComponent,
    TabBarComponent,
    ObservationBarComponent,
    TimeLimitedContentInfoComponent,
    NeighborWidgetComponent,
    AsyncPipe,
    ButtonIconComponent,
    TooltipDirective,
    PlatformLogoComponent,
  ]
})
export class ContentTopBarComponent {
  private store = inject(Store);
  private activityNavTreeService = inject(ActivityNavTreeService);
  private skillNavTreeService = inject(SkillNavTreeService);
  private groupNavTreeService = inject(GroupNavTreeService);
  private layoutService = inject(LayoutService);
  private tabService = inject(TabService);

  showBreadcrumbs = input(true);
  showLeftMenuOpener = input(false);
  /**
   * Whether the platform logo is not currently shown in the left menu, so this top bar may show it
   * instead. The left menu shows the logo by default; it doesn't when collapsed, in compact mode
   * (tree hidden) without search active, or absent entirely (e.g. LTI). The logo is actually
   * rendered only when this is true AND the active item requests the platform display (see
   * `showPlatformLogo`).
   */
  canDisplayPlatformLogo = input(false);

  isItemContentActive = this.store.selectSignal(fromItemContent.selectIsItemContentActive);
  title = this.store.selectSignal(fromCurrentContent.selectTitle);
  score = this.store.selectSignal(selectActiveItemDisplayedScore);
  activeItemNoScore = this.store.selectSignal(selectActiveItemNoScore);
  isItemMetadataLoading = computed(() => this.isItemContentActive() && this.activeItemNoScore() === undefined);
  displayScoreSection = computed(() => this.activeItemNoScore() === false);
  activeItemShowPlatform = this.store.selectSignal(fromItemContent.selectActiveContentShowPlatformInsteadOfScore);
  showPlatformLogo = computed(() => this.canDisplayPlatformLogo() && this.activeItemShowPlatform());
  isTitleSectionReady = computed(() => !this.isItemMetadataLoading());

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
  readonly hideHeader$ = this.store.select(fromItemContent.selectActiveContentHideHeader);

  showLeftMenu(): void {
    this.layoutService.toggleLeftMenu(true);
  }
}
