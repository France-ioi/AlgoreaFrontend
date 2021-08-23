import { Component, Input, OnChanges } from '@angular/core';
import { GetParticipantProgressService } from '../../http-services/get-participant-progress.service';
import { Observable, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { Item } from '../../http-services/get-item-by-id.service';
import { FetchState } from '../../../../shared/helpers/state';
import { ItemType } from '../../../../shared/helpers/item-type';

interface Column {
  field: string,
  header: string
}

interface RowData {
  id: string,
  type: ItemType,
  title: string,
  latestActivityAt: Date,
  timeSpent: number,
  submissions: number,
  score: number,
}

@Component({
  selector: 'alg-chapter-user-progress',
  templateUrl: './chapter-user-progress.component.html',
  styleUrls: [ './chapter-user-progress.component.scss' ]
})
export class ChapterUserProgressComponent implements OnChanges {
  @Input() id?: string;
  @Input() item?: Item;

  private readonly item$ = new ReplaySubject<Item>(1);
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
        },
        ...participantProgress.children.map(itemData => ({
          id: itemData.itemId,
          type: itemData.type,
          title: itemData.string.title || '',
          latestActivityAt: itemData.latestActivityAt,
          timeSpent: itemData.timeSpent,
          submissions: itemData.submissions,
          score: itemData.score,
        })),
      ])))
    ),
    mapToFetchState(),
  );

  columns: Column[] = [
    {
      field: 'title',
      header: 'Content',
    },
    {
      field: 'latestActivityAt',
      header: 'Latest activity',
    },
    {
      field: 'timeSpent',
      header: 'Time spent',
    },
    {
      field: 'submissions',
      header: '# subm.',
    },
    {
      field: 'score',
      header: 'Score',
    }
  ];

  constructor(private getParticipantProgressService: GetParticipantProgressService) { }

  ngOnChanges(): void {
    if (this.item) {
      this.item$.next(this.item);
    }
  }

}
