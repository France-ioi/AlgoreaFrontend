import { combineLatest, ReplaySubject, Subject } from 'rxjs';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GetItemChildrenService, ItemChild } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { bestAttemptFromResults } from 'src/app/models/attempts';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { canCurrentUserViewContent } from 'src/app/models/item-view-permission';
import { GroupWatchingService } from 'src/app/services/group-watching.service';
import { LayoutService } from 'src/app/services/layout.service';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithAttemptPipe, ContentTypeFromItemPipe } from 'src/app/pipes/itemRoute';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

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
    this.groupWatchingService.watchedGroup$.pipe(map(watchedGroup => watchedGroup?.route.id)),
  ]).pipe(
    switchMap(([{ id, attemptId }, watchedGroupId ]) => this.getItemChildrenService.get(id, attemptId, { watchedGroupId })),
    map<ItemChild[], ItemChildWithAdditions[]>(itemChildren => itemChildren.map(child => {
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
    private getItemChildrenService: GetItemChildrenService,
    private groupWatchingService: GroupWatchingService,
    private itemRouter: ItemRouter,
    private layoutService: LayoutService,
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