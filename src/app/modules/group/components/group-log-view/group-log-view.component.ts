import { Component, ElementRef, Input, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { BehaviorSubject, debounceTime, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, shareReplay } from 'rxjs/operators';
import { ActivityLog, ActivityLogService } from '../../../../shared/http-services/activity-log.service';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { DataPager } from 'src/app/shared/helpers/data-pager';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { canCloseOverlay } from 'src/app/shared/helpers/overlay';
import { LogActionDisplayPipe } from '../../../../shared/pipes/logActionDisplay';
import { UserCaptionPipe } from '../../../../shared/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/shared/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/shared/pipes/itemRoute';
import { PathSuggestionComponent } from '../../../shared-components/components/path-suggestion/path-suggestion.component';
import { RouterLink } from '@angular/router';
import { ScoreRingComponent } from '../../../shared-components/components/score-ring/score-ring.component';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ErrorComponent } from '../../../shared-components/components/error/error.component';
import { LoadingComponent } from '../../../shared-components/components/loading/loading.component';
import { NgIf, NgClass, AsyncPipe, DatePipe } from '@angular/common';

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
    RawItemRoutePipe,
    RouteUrlPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
  ],
})
export class GroupLogViewComponent implements OnChanges, OnDestroy {

  @Input() groupId?: string;
  @Input() showUserColumn = true;

  @ViewChild('op') op?: OverlayPanel;
  @ViewChildren('contentRef') contentRef?: QueryList<ElementRef<HTMLElement>>;

  private readonly showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private readonly showOverlaySubscription = this.showOverlay$.subscribe(data => {
    data ? this.op?.toggle(data.event, data.target) : this.op?.hide();
  });

  datapager = new DataPager({
    fetch: (pageSize, latestRow?: ActivityLog): Observable<ActivityLog[]> => this.getRows(pageSize, latestRow),
    pageSize: logsLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more logs, are you connected to the internet?`);
    },
  });

  readonly state$ = this.datapager.list$;

  constructor(
    private activityLogService: ActivityLogService,
    private actionFeedbackService: ActionFeedbackService
  ) {}


  ngOnChanges(changes: SimpleChanges): void {
    if ('groupId' in changes && !changes.groupId?.isFirstChange()) {
      throw new Error('Unexpected: groupId should not change');
    }
    if ('groupId' in changes && changes.groupId?.isFirstChange()) {
      this.resetRows();
    }
  }

  ngOnDestroy(): void {
    this.showOverlaySubject$.complete();
    this.showOverlaySubscription.unsubscribe();
  }

  refresh(): void {
    this.resetRows();
  }

  getRows(pageSize: number, latestRow?: ActivityLog): Observable<ActivityLog[]> {
    const paginationParams = latestRow === undefined ? undefined : {
      fromItemId: latestRow.item.id,
      fromParticipantId: latestRow.participant.id,
      fromAttemptId: latestRow.attemptId,
      fromAnswerId: latestRow.answerId ?? '0',
      fromActivityType: latestRow.activityType,
    };

    return this.activityLogService.getAllActivityLog(
      this.groupId, {
        limit: pageSize,
        pagination: paginationParams,
      }
    );
  }

  resetRows(): void {
    this.datapager.reset();
  }

  fetchMoreRows(): void {
    this.datapager.load();
  }

  onMouseEnter(event: Event, itemId: string, index: number): void {
    const targetRef = this.contentRef?.get(index);
    if (!targetRef) {
      throw new Error('Unexpected: Target is not found');
    }
    this.showOverlaySubject$.next({ event, itemId, target: targetRef.nativeElement });
  }

  onMouseLeave(event: MouseEvent): void {
    if (canCloseOverlay(event)) {
      this.closeOverlay();
    }
  }

  closeOverlay(): void {
    this.showOverlaySubject$.next(undefined);
  }
}
