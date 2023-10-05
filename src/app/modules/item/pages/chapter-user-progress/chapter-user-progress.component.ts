import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { GetParticipantProgressService } from '../../http-services/get-participant-progress.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { mapToFetchState, readyData } from '../../../../shared/operators/state';
import { Item } from '../../http-services/get-item-by-id.service';
import { FetchState } from '../../../../shared/helpers/state';
import { ItemType } from '../../../../shared/helpers/item-type';
import { ItemData } from '../../services/item-datasource.service';
import { ItemRouter } from '../../../../shared/routing/item-router';
import { GroupWatchingService } from '../../../../core/services/group-watching.service';
import { ItemPermWithWatch } from '../../../../shared/models/domain/item-watch-permission';
import { DurationToReadable } from 'src/app/shared/pipes/duration';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { ContentTypeFromItemPipe } from 'src/app/shared/pipes/itemRoute';
import { ScoreRingComponent } from '../../../shared-components/components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ErrorComponent } from '../../../shared-components/components/error/error.component';
import { LoadingComponent } from '../../../shared-components/components/loading/loading.component';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgClass, NgSwitchDefault, AsyncPipe, DatePipe, I18nPluralPipe } from '@angular/common';

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
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    ButtonModule,
    TableModule,
    SharedModule,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgClass,
    RouterLink,
    ScoreRingComponent,
    NgSwitchDefault,
    AsyncPipe,
    DatePipe,
    I18nPluralPipe,
    ContentTypeFromItemPipe,
    RouteUrlPipe,
    DurationToReadable
  ],
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
          noScore: item.noScore,
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
