import { Component, computed, inject, input, output } from '@angular/core';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { ItemPermWithWatch } from 'src/app/items/models/item-watch-permission';
import { UserSessionService } from 'src/app/services/user-session.service';
import { DurationToReadablePipe, SecondsToDurationPipe } from 'src/app/pipes/duration';
import { AllowsWatchingItemAnswersPipe } from 'src/app/items/models/item-watch-permission';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { Router, RouterLink } from '@angular/router';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ItemType } from 'src/app/items/models/item-type';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { Progress } from 'src/app/items/containers/group-progress-grid/group-progress-grid.types';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';

export interface ProgressData {
  progress: Progress,
  colItem: {
    type: ItemType,
    fullRoute: FullItemRoute,
    permissions: ItemPermWithWatch,
  },
  rowGroup: {
    id: string,
    isUser: boolean,
  },
}

@Component({
  selector: 'alg-user-progress-details',
  templateUrl: './user-progress-details.component.html',
  styleUrl: './user-progress-details.component.scss',
  imports: [
    ScoreRingComponent,
    RouterLink,
    AsyncPipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    AllowsWatchingItemAnswersPipe,
    SecondsToDurationPipe,
    DurationToReadablePipe,
    RelativeTimeComponent,
    DecimalPipe,
    ButtonComponent,
    TooltipDirective,
  ]
})
export class UserProgressDetailsComponent {
  private userSessionService = inject(UserSessionService);
  private store = inject(Store);
  private router = inject(Router);

  readonly progressData = input<ProgressData>();
  readonly canEditPermissions = input<boolean>();
  readonly editPermissions = output<void>();

  readonly progress = computed(() => this.progressData()?.progress);

  currentUser$ = this.userSessionService.userProfile$;
  private readonly observedGroupInfo = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  onViewAnswer(): void {
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: {
        url: this.router.url,
        label: $localize`Go back to the stats grid`,
      },
    }));
  }

  onViewHistory(): void {
    const progressData = this.progressData();
    if (!progressData) return;
    const observedGroup = this.observedGroupInfo();
    // Always register, even when observation info hasn't resolved yet: the History link's
    // routerLink navigates regardless of this dispatch, so silently skipping registration
    // when `observedGroup` is null (a real race on slower runtimes — e.g. Firefox CI) leaves
    // the destination's back-link bar permanently hidden. Falling back to a generic label
    // keeps the back-link functional; the descriptive variant is used whenever info is ready.
    const label = observedGroup
      ? $localize`Return to ${observedGroup.name} group stats`
      : $localize`Return to group stats`;
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({ backLink: { url: this.router.url, label } }));
  }
}
