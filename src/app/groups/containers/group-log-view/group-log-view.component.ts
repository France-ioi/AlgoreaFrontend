import {
  Component,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { ActivityLogs, ActivityLogService } from 'src/app/data-access/activity-log.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DataPager } from 'src/app/utils/data-pager';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LogActionDisplayPipe } from 'src/app/pipes/logActionDisplay';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from 'src/app/containers/path-suggestion/path-suggestion.component';
import { RouterLink } from '@angular/router';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { UserSessionService } from '../../../services/user-session.service';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { LogActivityTypeIconPipe } from 'src/app/pipes/logActivityTypeIcon';

const logsLimit = 20;

@Component({
  selector: 'alg-group-log-view',
  templateUrl: './group-log-view.component.html',
  styleUrls: [ './group-log-view.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    ButtonModule,
    TableModule,
    SharedModule,
    ScoreRingComponent,
    NgClass,
    RouterLink,
    OverlayPanelModule,
    PathSuggestionComponent,
    AsyncPipe,
    DatePipe,
    ItemRoutePipe,
    RouteUrlPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
    ShowOverlayHoverTargetDirective,
    ShowOverlayDirective,
    LogActivityTypeIconPipe,
  ],
})
export class GroupLogViewComponent implements OnChanges {

  @Input() groupId?: string;
  @Input() showUserColumn = true;

  itemId = signal<string | undefined>(undefined);

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> => this.getRows(pageSize, latestRow),
    pageSize: logsLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  readonly state$ = this.datapager.list$;

  constructor(
    private activityLogService: ActivityLogService,
    private actionFeedbackService: ActionFeedbackService,
    private sessionService: UserSessionService,
  ) {}


  ngOnChanges(changes: SimpleChanges): void {
    if ('groupId' in changes && !changes.groupId?.isFirstChange()) {
      throw new Error('Unexpected: groupId should not change');
    }
    if ('groupId' in changes && changes.groupId?.isFirstChange()) {
      this.resetRows();
    }
  }

  refresh(): void {
    this.resetRows();
  }

  getRows(pageSize: number, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> {
    const paginationParams = latestRow === undefined ? undefined : {
      fromItemId: latestRow.item.id,
      fromParticipantId: latestRow.participant.id,
      fromAttemptId: latestRow.attemptId,
      fromAnswerId: latestRow.answerId ?? '0',
      fromActivityType: latestRow.activityType,
    };

    return this.activityLogService.getAllActivityLog({
      watchedGroupId: this.groupId,
      limit: pageSize,
      pagination: paginationParams,
    }).pipe(
      withLatestFrom(this.sessionService.userProfile$),
      map(([ logs, currentUserProfile ]) => logs.map(log => ({
        ...log,
        allowToViewAnswer: log.participant.id === currentUserProfile.groupId || !!log.canWatchAnswer,
      })))
    );
  }

  resetRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }
}
