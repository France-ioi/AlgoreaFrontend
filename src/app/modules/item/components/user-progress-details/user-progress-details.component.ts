import { AfterViewInit, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { delay, take } from 'rxjs';
import { TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';
import { FullItemRoute } from '../../../../shared/routing/item-route';
import { ItemPermWithWatch } from '../../../../shared/models/domain/item-watch-permission';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { ItemChildType } from '../../http-services/get-item-children.service';
import { TypeFilter } from '../../helpers/composition-filter';
import { DurationToReadable } from 'src/app/shared/pipes/duration';
import { AllowsWatchingItemAnswersPipe } from 'src/app/shared/models/domain/item-watch-permission';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { ItemRouteWithAnswerPipe } from 'src/app/shared/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ScoreRingComponent } from '../../../shared-components/components/score-ring/score-ring.component';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { SharedModule } from 'primeng/api';

export interface ProgressData {
  progress: TeamUserProgress,
  target: Element,
  currentFilter: TypeFilter,
  colItem: {
    type: ItemChildType,
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
    ItemRouteWithAnswerPipe,
    RouteUrlPipe,
    AllowsWatchingItemAnswersPipe,
    DurationToReadable,
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
