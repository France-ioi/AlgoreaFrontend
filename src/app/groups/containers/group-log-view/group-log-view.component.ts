import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { ActivityLogs, ActivityLogService } from 'src/app/data-access/activity-log.service';
import { DataPager } from 'src/app/utils/data-pager';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LogActionDisplayPipe } from 'src/app/pipes/logActionDisplay';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from 'src/app/containers/path-suggestion/path-suggestion.component';
import { Router, RouterLink } from '@angular/router';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe, DatePipe } from '@angular/common';
import { UserSessionService } from '../../../services/user-session.service';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { LogActivityTypeIconPipe } from 'src/app/pipes/logActivityTypeIcon';
import { IsHttpForbiddenPipe } from 'src/app/utils/error-handling/http-error.pipes';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { ItemRoute } from 'src/app/models/routing/item-route';
import { AnswerId } from 'src/app/models/ids';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkNoDataRow,
  CdkRow,
  CdkRowDef,
  CdkTable
} from '@angular/cdk/table';

const logsLimit = 20;

@Component({
  selector: 'alg-group-log-view',
  templateUrl: './group-log-view.component.html',
  styleUrl: './group-log-view.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    ScoreRingComponent,
    RouterLink,
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
    ButtonComponent,
    CdkTable,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    CdkCell,
    CdkCellDef,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
    IsHttpForbiddenPipe,
  ]
})
export class GroupLogViewComponent {
  private activityLogService = inject(ActivityLogService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private sessionService = inject(UserSessionService);
  private store = inject(Store);
  private router = inject(Router);

  /** Undefined means "my own log" (see user.component). Must not change after init — DataPager's fetch closure captures it. */
  groupId = input<string>();
  showUserColumn = input(true);

  itemId = signal<string | undefined>(undefined);
  displayedColumns = computed(() => [
    'action',
    'content',
    ...(this.showUserColumn() ? [ 'user' ] : []),
    'time',
  ]);

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLogs[number]): Observable<ActivityLogs> => this.getRows(pageSize, latestRow),
    pageSize: logsLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  readonly state$ = this.datapager.list$;

  private groupIdAtInit: string | undefined | null = null;

  constructor() {
    effect(() => {
      const groupId = this.groupId();
      if (this.groupIdAtInit === null) {
        this.groupIdAtInit = groupId;
        this.resetRows();
        return;
      }
      if (groupId !== this.groupIdAtInit) {
        throw new Error('Unexpected: groupId should not change');
      }
    });
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
      watchedGroupId: this.groupId(),
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

  onViewAnswer(): void {
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: {
        url: this.router.url,
        label: $localize`Back to the history page`,
      },
    }));
  }

  answerRouteExtras(answerId: AnswerId): Partial<ItemRoute> {
    return { answer: { id: answerId } };
  }
}
