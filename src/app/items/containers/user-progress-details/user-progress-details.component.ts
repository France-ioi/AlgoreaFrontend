import { SimpleChanges, inject } from '@angular/core';
import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { ItemPermWithWatch } from 'src/app/items/models/item-watch-permission';
import { UserSessionService } from 'src/app/services/user-session.service';
import { DurationToReadablePipe, SecondsToDurationPipe } from 'src/app/pipes/duration';
import { AllowsWatchingItemAnswersPipe } from 'src/app/items/models/item-watch-permission';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { Router, RouterLink } from '@angular/router';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { NgClass, AsyncPipe, DecimalPipe } from '@angular/common';
import { ItemType } from 'src/app/items/models/item-type';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { Progress } from 'src/app/items/containers/group-progress-grid/group-progress-grid.component';
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
  styleUrls: [ './user-progress-details.component.scss' ],
  imports: [
    ScoreRingComponent,
    NgClass,
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
export class UserProgressDetailsComponent implements OnChanges {
  private userSessionService = inject(UserSessionService);
  private store = inject(Store);
  private router = inject(Router);

  @Input() progressData?: ProgressData;
  @Input() canEditPermissions?: boolean;

  @Output() editPermissions = new EventEmitter<void>();

  progress?: ProgressData['progress'];

  currentUser$ = this.userSessionService.userProfile$;
  private readonly observedGroupInfo = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.progressData && !changes.progressData.firstChange) {
      this.progress = this.progressData?.progress;
    }
  }

  onViewAnswer(): void {
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: {
        url: this.router.url,
        label: $localize`Go back to the stats grid`,
      },
    }));
  }

  onViewHistory(): void {
    if (!this.progressData) return;
    const observedGroup = this.observedGroupInfo();
    if (!observedGroup) return;
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: {
        url: this.router.url,
        label: $localize`Return to ${observedGroup.name} group stats`,
      },
    }));
  }
}
