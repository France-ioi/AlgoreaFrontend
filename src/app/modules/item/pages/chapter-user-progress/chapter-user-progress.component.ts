import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { GetParticipantProgressService } from '../../http-services/get-participant-progress.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { Item } from '../../http-services/get-item-by-id.service';
import { FetchState } from '../../../../shared/helpers/state';
import { ItemType } from '../../../../shared/helpers/item-type';
import { ItemData } from '../../services/item-datasource.service';
import { ItemRouter } from '../../../../shared/routing/item-router';
import { GroupWatchingService } from '../../../../core/services/group-watching.service';
import { ItemPermWithWatch } from '../../../../shared/models/domain/item-watch-permission';

interface Column {
  field: string,
  header: string,
}

interface RowData {
  id: string,
  type: ItemType,
  title: string,
  latestActivityAt: Date | null,
  timeSpent: number,
  submissions: number,
  score: number,
  currentUserPermissions?: ItemPermWithWatch,
}

@Component({
  selector: 'alg-chapter-user-progress',
  templateUrl: './chapter-user-progress.component.html',
  styleUrls: [ './chapter-user-progress.component.scss' ]
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
          timeSpent: participantProgress.item.timeSpent,
          submissions: participantProgress.item.submissions,
          score: participantProgress.item.score,
          currentUserPermissions: item.permissions,
        },
        ...participantProgress.children.map(itemData => ({
          id: itemData.itemId,
          type: itemData.type,
          title: itemData.string.title || '',
          latestActivityAt: itemData.latestActivityAt,
          timeSpent: itemData.timeSpent,
          submissions: itemData.submissions,
          score: itemData.score,
          currentUserPermissions: itemData.currentUserPermissions,
        })),
      ])))
    ),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  columns: Column[] = [
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
      header: $localize`:Truncated title (little space available) for 'number of submissions':# subm.`,
    },
    {
      field: 'score',
      header: $localize`Score`,
    }
  ];

  constructor(
    private getParticipantProgressService: GetParticipantProgressService,
    private itemRouter: ItemRouter,
    private groupWatchingService: GroupWatchingService,
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
