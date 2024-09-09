import { AfterViewInit, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { delay, take } from 'rxjs';
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
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { ItemType } from 'src/app/items/models/item-type';
import { ButtonModule } from 'primeng/button';
import { RelativeTimePipe } from 'src/app/pipes/relativeTime';
import { Progress } from 'src/app/items/containers/group-progress-grid/group-progress-grid.component';

export interface ProgressData {
  progress: Progress,
  target: Element,
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
    ButtonModule,
    RelativeTimePipe,
  ],
})
export class UserProgressDetailsComponent implements OnChanges, AfterViewInit {

  @Input() progressData?: ProgressData;
  @Input() canEditPermissions?: boolean;

  @Output() editPermissions = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  @ViewChild('panel') panel?: OverlayPanel;

  progress?: ProgressData['progress'];

  currentUser$ = this.userSessionService.userProfile$;

  constructor(private userSessionService: UserSessionService) {
  }

  ngAfterViewInit(): void {
    if (this.progressData) this.showOverlay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.progressData && !changes.progressData.firstChange) {
      this.progress = this.progressData?.progress;
      this.toggleOverlay();
    }
  }

  private toggleOverlay(): void {
    const shouldReopen = this.panel?.overlayVisible && !!this.progressData;
    if (shouldReopen) return this.reopenOverlay();
    this.progressData ? this.showOverlay() : this.hideOverlay();
  }

  private showOverlay(): void {
    setTimeout(() => {
      if (!this.panel) throw new Error('panel not available');
      if (!this.progressData) throw new Error('no progress to render');
      this.panel.show(null, this.progressData.target);
    });
  }

  private hideOverlay(): void {
    if (!this.panel) throw new Error('panel not available');
    this.panel.hide();
  }

  private reopenOverlay(): void {
    if (!this.panel) throw new Error('no panel available');
    this.panel.onHide.pipe(delay(0), take(1)).subscribe(() => this.showOverlay());
    this.hideOverlay();
  }

}
