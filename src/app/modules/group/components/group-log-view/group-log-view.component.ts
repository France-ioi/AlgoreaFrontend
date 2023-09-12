import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BehaviorSubject, debounceTime, merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { ActivityLog, ActivityLogService } from '../../../../shared/http-services/activity-log.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import { canCloseOverlay } from '../../../../shared/helpers/overlay';
import { DataPager } from 'src/app/shared/helpers/data-pager';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

interface Column {
  field: string,
  header: string,
}

interface Data {
  columns: Column[],
  rowData: ActivityLog[],
  isFetching: boolean,
  hasError: boolean,
}

const logsLimit = 20;

@Component({
  selector: 'alg-group-log-view',
  templateUrl: './group-log-view.component.html',
  styleUrls: [ './group-log-view.component.scss' ],
})
export class GroupLogViewComponent implements OnChanges, OnDestroy, OnInit {

  @Input() groupId?: string;
  @Input() showUserColumn = true;

  @ViewChild('op') op?: OverlayPanel;
  @ViewChildren('contentRef') contentRef?: QueryList<ElementRef<HTMLElement>>;

  private readonly groupId$ = new ReplaySubject<string | undefined>(1);
  private readonly refresh$ = new Subject<void>();
  readonly state$ = this.groupId$.pipe(
    switchMap(() => this.getData$()),
    mapToFetchState({ resetter: this.refresh$ }),
  );
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

  constructor(
    private activityLogService: ActivityLogService,
    private actionFeedbackService: ActionFeedbackService
  ) {}

  ngOnInit(): void{
    this.resetRows();
  }

  ngOnChanges(): void {
    this.groupId$.next(this.groupId);
  }

  ngOnDestroy(): void {
    this.groupId$.complete();
    this.refresh$.complete();
    this.showOverlaySubject$.complete();
    this.showOverlaySubscription.unsubscribe();
  }

  refresh(): void {
    this.refresh$.next();
    this.resetRows();
  }

  private getData$(): Observable<Data> {
    return this.datapager.list$.pipe(
      map(fetchData => ({
        columns: this.getLogColumns(),
        rowData: fetchData.data ?? [],
        isFetching: fetchData.isFetching,
        hasError: fetchData.isError,
      }))
    );
  }

  getRows(pageSize: number, latestRow?: ActivityLog): Observable<ActivityLog[]> {
    return this.groupId$.pipe(
      switchMap(groupId => {
        const paginationParams = latestRow === undefined ? undefined : {
          fromItemId: latestRow.item.id,
          fromParticipantId: latestRow.participant.id,
          fromAttemptId: latestRow.attemptId,
          fromAnswerId: latestRow.answerId ?? '0',
          fromActivityType: latestRow.activityType,
        };

        return this.activityLogService.getAllActivityLog(
          groupId , {
            limit: pageSize,
            pagination: paginationParams,
          }
        );
      }),
    );
  }

  private getLogColumns(): Column[] {
    const columns = [
      {
        field: 'activityType',
        header: $localize`Action`,
      },
      {
        field: 'item.string.title',
        header: $localize`Content`,
      },
      {
        field: 'item.user',
        header: $localize`:User column label:User`,
        disabled: !this.showUserColumn,
      },
      {
        field: 'at',
        header: $localize`Time`,
      }
    ];

    return columns.filter(col => !col.disabled).map(col => ({
      field: col.field,
      header: col.header,
    }));
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

  onMouseLeave(event: MouseEvent, field: string): void {
    if (field === 'item.string.title' && canCloseOverlay(event)) {
      this.closeOverlay();
    }
  }

  closeOverlay(): void {
    this.showOverlaySubject$.next(undefined);
  }

}
