import { combineLatest, Subject } from 'rxjs';
import { Component, inject, input, DestroyRef } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../models/item-data';
import { bestAttemptFromResults } from 'src/app/items/models/attempts';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { switchMapToFetchState } from 'src/app/utils/operators/state';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { LayoutService } from 'src/app/services/layout.service';

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrl: './chapter-children.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    ScoreRingComponent,
    ItemChildrenListComponent,
    AsyncPipe,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    ButtonComponent,
  ]
})
export class ChapterChildrenComponent {
  private store = inject(Store);
  private getItemChildrenService = inject(GetItemChildrenService);

  readonly itemData = input.required<ItemData>();

  layoutService = inject(LayoutService);

  private readonly refresh$ = new Subject<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.refresh$.complete());
  }

  private readonly params$ = toObservable(this.itemData).pipe(
    map(itemData => (itemData.currentResult
      ? {
        id: itemData.item.id,
        attemptId: itemData.currentResult.attemptId,
        currentResultValidated: itemData.currentResult.validated,
      }
      : undefined)),
    filter(isNotUndefined),
    distinctUntilChanged((a, b) =>
      a.id === b.id && a.attemptId === b.attemptId && a.currentResultValidated === b.currentResultValidated),
  );

  readonly state$ = combineLatest([
    this.params$,
    this.store.select(fromObservation.selectObservedGroupId),
  ]).pipe(
    switchMapToFetchState(
      ([{ id, attemptId, currentResultValidated }, observedGroupId ]) =>
        this.getItemChildrenService.get(id, attemptId, { watchedGroupId: observedGroupId ?? undefined }).pipe(
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
            missingValidation: !(currentResultValidated || children.filter(item => item.category === 'Validation')
              .every(item => item.result && item.result.validated)),
          })),
        ),
      { resetter: this.refresh$ },
    ),
  );

  leftMenuShown = toSignal(this.layoutService.leftMenu$.pipe(map(({ shown }) => shown)), { initialValue: true });

  refresh(): void {
    this.refresh$.next();
  }

  showLeftMenu(): void {
    this.layoutService.toggleLeftMenu(true);
  }
}
