import { SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { ItemPermWithWatch } from 'src/app/items/models/item-watch-permission';
import { UserSessionService } from 'src/app/services/user-session.service';
import { DurationToReadablePipe, SecondsToDurationPipe } from 'src/app/pipes/duration';
import { AllowsWatchingItemAnswersPipe } from 'src/app/items/models/item-watch-permission';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { NgIf, NgClass, AsyncPipe, DecimalPipe } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { ItemType } from 'src/app/items/models/item-type';
import { RelativeTimePipe } from 'src/app/pipes/relativeTime';
import { Progress } from 'src/app/items/containers/group-progress-grid/group-progress-grid.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

export interface ProgressData {
  progress: Progress,
  colItem: {
    type: ItemType,
    fullRoute: FullItemRoute,
    permissions: ItemPermWithWatch,
  },
}

@Component({
  selector: 'alg-user-progress-details',
  templateUrl: './user-progress-details.component.html',
  styleUrls: [ './user-progress-details.component.scss' ],
  standalone: true,
  imports: [
    OverlayPanelModule,
    SharedModule,
    NgIf,
    ScoreRingComponent,
    TooltipModule,
    NgClass,
    RouterLink,
    AsyncPipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    AllowsWatchingItemAnswersPipe,
    SecondsToDurationPipe,
    DurationToReadablePipe,
    RelativeTimePipe,
    DecimalPipe,
    ButtonComponent,
  ],
})
export class UserProgressDetailsComponent implements OnChanges {

  @Input() progressData?: ProgressData;
  @Input() canEditPermissions?: boolean;

  @Output() editPermissions = new EventEmitter<void>();

  progress?: ProgressData['progress'];

  currentUser$ = this.userSessionService.userProfile$;

  constructor(private userSessionService: UserSessionService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.progressData && !changes.progressData.firstChange) {
      this.progress = this.progressData?.progress;
    }
  }

}
