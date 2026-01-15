import { Component, computed, Input, OnChanges, OnDestroy } from '@angular/core';
import { GetParticipantProgressService } from '../../data-access/get-participant-progress.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { FetchState } from 'src/app/utils/state';
import { ItemType } from 'src/app/items/models/item-type';
import { ItemData } from '../../models/item-data';
import { ItemPermWithWatch } from 'src/app/items/models/item-watch-permission';
import { DurationToReadablePipe, SecondsToDurationPipe } from 'src/app/pipes/duration';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
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
import { toSignal } from '@angular/core/rxjs-interop';

interface RowData {
  id: string,
  type: ItemType,
  title: string,
  latestActivityAt: Date | null,
  timeSpent: number,
  submissions: number,
  score: number,
  currentUserPermissions: ItemPermWithWatch,
}

@Component({
  selector: 'alg-chapter-user-progress',
  templateUrl: './chapter-user-progress.component.html',
  styleUrls: [ './chapter-user-progress.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    NgClass,
    RouterLink,
    ScoreRingComponent,
    AsyncPipe,
    DatePipe,
    ItemRoutePipe,
    RouteUrlPipe,
    SecondsToDurationPipe,
    DurationToReadablePipe,
    ButtonComponent,
    CdkTable,
    CdkCell,
    CdkCellDef,
    CdkHeaderCell,
    CdkColumnDef,
    CdkHeaderCellDef,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
  ]
})
export class ChapterUserProgressComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly item$ = new ReplaySubject<Item>(1);
  private readonly refresh$ = new Subject<void>();
  state$: Observable<FetchState<RowData[]>> = this.item$.pipe(
    switchMap(item =>
      this.getParticipantProgressService.get(item.id).pipe(map(participantProgress => ([
        {
          id: item.id,
          type: item.type,
          title: item.string.title || '',
          latestActivityAt: participantProgress.item.latestActivityAt,
          hintsRequested: participantProgress.item.hintsRequested,
          timeSpent: participantProgress.item.timeSpent,
          submissions: participantProgress.item.submissions,
          score: participantProgress.item.score,
          validated: participantProgress.item.validated,
          currentUserPermissions: item.permissions,
          noScore: item.noScore,
        },
        ...(participantProgress.children || []).map(itemData => ({
          id: itemData.itemId,
          type: itemData.type,
          title: itemData.string.title || '',
          latestActivityAt: itemData.latestActivityAt,
          hintsRequested: itemData.hintsRequested,
          timeSpent: itemData.timeSpent,
          submissions: itemData.submissions,
          score: itemData.score,
          validated: itemData.validated,
          currentUserPermissions: itemData.currentUserPermissions,
          noScore: itemData.noScore,
        })),
      ])))
    ),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  columns$ = this.state$.pipe(
    readyData(),
    map(items =>
      [
        {
          field: 'title',
          header: $localize`Content`,
        },
        {
          field: 'latestActivityAt',
          header: $localize`Latest activity`,
        },
        {
          field: 'timeSpent',
          header: $localize`Time spent`,
        },
        {
          field: 'submissions',
          header: $localize`:Truncated title (little space available) for 'number of submissions':# Subm.`,
          disabled: !items.some(item => item.type !== 'Chapter'),
        },
        {
          field: 'score',
          header: $localize`Score`,
        }
      ].filter(column => !column.disabled),
    ),
  );

  columns = toSignal(this.columns$, { initialValue: [] });
  displayedColumns = computed(() => this.columns().map(column => column.field));

  constructor(
    private getParticipantProgressService: GetParticipantProgressService,
  ) { }

  ngOnChanges(): void {
    if (this.itemData) {
      this.item$.next(this.itemData.item);
    }
  }

  ngOnDestroy(): void {
    this.item$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

}
