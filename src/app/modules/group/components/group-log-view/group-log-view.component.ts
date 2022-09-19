import { Component, ElementRef, Input, OnChanges, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BehaviorSubject, debounceTime, merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { ActivityLog, ActivityLogService } from '../../../../shared/http-services/activity-log.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import { canCloseOverlay } from '../../../../shared/helpers/overlay';

interface Column {
  field: string,
  header: string,
}

interface Data {
  columns: Column[],
  rowData: ActivityLog[],
}

@Component({
  selector: 'alg-group-log-view',
  templateUrl: './group-log-view.component.html',
  styleUrls: [ './group-log-view.component.scss' ],
})
export class GroupLogViewComponent implements OnChanges, OnDestroy {

  @Input() groupId?: string;
  @Input() showUserColumn = true;

  @ViewChild('op') op?: OverlayPanel;
  @ViewChildren('contentRef') contentRef?: QueryList<ElementRef<HTMLElement>>;

  private readonly groupId$ = new ReplaySubject<string | undefined>(1);
  private readonly refresh$ = new Subject<void>();
  readonly state$ = this.groupId$.pipe(
    switchMap((groupId: string | undefined) => this.getData$(groupId)),
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

  constructor(
    private activityLogService: ActivityLogService,
  ) {}

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
  }

  private getData$(groupId?: string): Observable<Data> {
    return this.activityLogService.getAllActivityLog(groupId).pipe(
      map((data: ActivityLog[]) => ({
        columns: this.getLogColumns(),
        rowData: data
      }))
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
