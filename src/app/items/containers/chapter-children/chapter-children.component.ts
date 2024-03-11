import { combineLatest, ReplaySubject, Subject } from 'rxjs';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { bestAttemptFromResults } from 'src/app/items/models/attempts';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithAttemptPipe, ContentTypeFromItemPipe } from 'src/app/pipes/itemRoute';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: [ './chapter-children.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    NgFor,
    RouterLink,
    ScoreRingComponent,
    ItemChildrenListComponent,
    AsyncPipe,
    ItemRouteWithAttemptPipe,
    ContentTypeFromItemPipe,
    RouteUrlPipe,
  ],
})
export class ChapterChildrenComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = combineLatest([
    this.params$.pipe(distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId)),
    this.store.select(fromObservation.selectObservedGroupId),
  ]).pipe(
    switchMap(([{ id, attemptId }, observedGroupId ]) =>
      this.getItemChildrenService.get(id, attemptId, { watchedGroupId: observedGroupId ?? undefined })),
    map<ItemChildren, ItemChildWithAdditions[]>(itemChildren => itemChildren.map(child => {
      const res = bestAttemptFromResults(child.results);
      return {
        ...child,
        isLocked: !canCurrentUserViewContent(child),
        result: res === null ? undefined : {
          attemptId: res.attemptId,
          validated: res.validated,
          score: res.scoreComputed,
        },
      };
    })),
    map(children => ({
      children,
      missingValidation: !(this.itemData?.currentResult?.validated || children.filter(item => item.category === 'Validation')
        .every(item => item.result && item.result.validated)),
    })),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private store: Store,
    private getItemChildrenService: GetItemChildrenService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.itemData?.currentResult) {
      this.params$.next({
        id: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
      });
    }
  }

  ngOnDestroy(): void {
    this.params$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
