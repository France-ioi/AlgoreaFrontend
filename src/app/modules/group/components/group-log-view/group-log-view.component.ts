import { Component, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, fromEvent, merge, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { ActivityLog, ActivityLogService } from '../../../../shared/http-services/activity-log.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import { isNotNull } from 'src/app/shared/helpers/null-undefined-predicates';

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

  private readonly groupId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();
  readonly state$ = this.groupId$.pipe(
    switchMap((groupId: string) => this.getData$(groupId)),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  private readonly showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  readonly showOverlay$ = this.showOverlaySubject$.pipe(debounceTime(100), distinctUntilChanged(), shareReplay(1));

  private showOverlaySubscription = this.showOverlay$.subscribe(data => {
    data ? this.op?.toggle(data.event, data.target) : this.op?.hide();
  });
  private closeOverlaySubscription?: Subscription;

  constructor(
    private activityLogService: ActivityLogService,
  ) {}

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
    this.showOverlaySubscription.unsubscribe();
    this.closeOverlaySubscription?.unsubscribe();
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

  onMouseEnter(event: Event, itemId: string): void {
    const td = event.target instanceof HTMLElement ? event.target.closest('td') : null;

    if (td === this.showOverlaySubject$.value?.target) return;
    this.closeOverlaySubscription?.unsubscribe();
    this.showOverlaySubject$.next(undefined);


    const overlay = (this.op?.el.nativeElement as HTMLElement | undefined);
    if (!td || !(event.target instanceof HTMLElement) || !this.op || !overlay) throw new Error('unexpected');
    this.showOverlaySubject$.next({ event, itemId, target: td });

    const op = this.op;
    this.closeOverlaySubscription = this.op.onShow.pipe(
      take(1),
      map(() => overlay.querySelector<HTMLElement>('alg-path-suggestion')),
      filter(isNotNull),
      switchMap(pathSuggestion => {
        const closeOnTdMouseLeave$ = merge(
          fromEvent(td, 'mouseleave').pipe(map(() => true)),
          fromEvent(pathSuggestion, 'mouseenter').pipe(map(() => false)), // cancel if mouse enters pathSuggestion
        ).pipe(distinctUntilChanged(), debounceTime(100), filter(Boolean));

        const closeOnOverlayMouseLeave$ = merge(
          fromEvent(pathSuggestion, 'mouseleave').pipe(map(() => true)),
          fromEvent(td, 'mouseenter').pipe(map(() => false)), // cancel if mouse re-enters target
        ).pipe(distinctUntilChanged(), debounceTime(100), filter(Boolean));

        return merge(closeOnTdMouseLeave$, closeOnOverlayMouseLeave$).pipe(takeUntil(op.onHide), take(1));
      }),
    ).subscribe(() => {
      this.showOverlaySubject$.next(undefined);
    });
  }

}
