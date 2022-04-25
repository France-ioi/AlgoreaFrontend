import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { BehaviorSubject, debounceTime, Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { ActivityLog, ActivityLogService } from '../../../../shared/http-services/activity-log.service';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { OverlayPanel } from 'primeng/overlaypanel';

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
export class GroupLogViewComponent implements OnChanges, OnInit, OnDestroy {

  @Input() groupId?: string;
  @Input() showUserColumn = true;

  @ViewChild('op') op?: OverlayPanel;
  @ViewChildren('contentRef') contentRef?: QueryList<ElementRef<HTMLElement>>;

  private readonly unsubscribe$ = new Subject<void>();
  private readonly groupId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();
  readonly state$ = this.groupId$.pipe(
    switchMap((groupId: string) => this.getData$(groupId)),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  showOverlay$ = this.showOverlaySubject$.asObservable().pipe(debounceTime(750), shareReplay());

  constructor(
    private activityLogService: ActivityLogService,
  ) {}

  ngOnInit(): void {
    this.showOverlay$.pipe(filter(isNotUndefined), takeUntil(this.unsubscribe$)).subscribe(data =>
      this.op?.toggle(data.event, data.target)
    );
  }

  ngOnChanges(): void {
    if (!this.groupId) {
      return;
    }

    this.groupId$.next(this.groupId);
  }

  ngOnDestroy(): void {
    this.groupId$.complete();
    this.refresh$.complete();
    this.showOverlaySubject$.complete();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

  private getData$(groupId: string): Observable<Data> {
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

  onMouseLeave(): void {
    this.showOverlaySubject$.next(undefined);
  }

}
