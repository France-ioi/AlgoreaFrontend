import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { GetItemChildrenService } from 'src/app/data-access/get-item-children.service';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { fromObservation } from 'src/app/store/observation';
import { switchMapToFetchState } from 'src/app/utils/operators/state';
import { DescriptionIframeComponent } from 'src/app/ui-components/description-iframe/description-iframe.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { isASkill } from 'src/app/items/models/item-type';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { mapChildWithAdditions } from '../item-children-list/map-item-child-with-additions';
import { ChapterChildrenGridComponent } from './chapter-children-grid.component';
import { planTwoLevelsContainerChildren } from './plan-two-levels-container-children';

interface ReadyBody {
  children: ItemChildWithAdditions[],
  attemptId: string,
}

@Component({
  selector: 'alg-two-levels-container-section',
  templateUrl: './two-levels-container-section.component.html',
  styleUrl: './two-levels-container-section.component.scss',
  imports: [
    AsyncPipe,
    RouterLink,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    DescriptionIframeComponent,
    ChapterChildrenGridComponent,
    ErrorComponent,
  ],
})
export class TwoLevelsContainerSectionComponent {
  private readonly store = inject(Store);
  private readonly resultActionsService = inject(ResultActionsService);
  private readonly getItemChildrenService = inject(GetItemChildrenService);

  readonly item = input.required<ItemChildWithAdditions>();
  /** Ancestors of this L1 child (parent chapter path including the parent chapter id). */
  readonly path = input.required<string[]>();
  /** Parent chapter attempt id — used for title link fallback and for start-result. */
  readonly parentAttemptId = input.required<string>();
  readonly leftMenuShown = input(true);

  readonly isSkill = computed(() => isASkill(this.item()));
  readonly placeholderSlots = [ 0, 1, 2 ] as const;
  readonly plan = computed(() => planTwoLevelsContainerChildren(this.item()));
  readonly loadingAriaLabel = computed(() => (
    this.isSkill()
      ? $localize`Loading skill content`
      : $localize`Loading chapter content`
  ));

  private readonly refresh$ = new Subject<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.refresh$.complete());
  }

  // Drive from `plan` (derived from `item`) + observation only — do not also combine `item`, or one
  // item change would emit twice and could POST start-result twice.
  private readonly fetchParams$ = combineLatest([
    toObservable(this.plan),
    this.store.select(fromObservation.selectObservedGroupId),
  ]).pipe(
    filter(([ plan ]) => plan.action === 'startAndFetch' || plan.action === 'fetch'),
  );

  /**
   * Only subscribed (via template `async` pipe) when the plan needs a network round-trip.
   * Auto-start is intentionally template-driven; it also re-runs if observedGroupId changes while shown.
   */
  readonly fetchState$ = this.fetchParams$.pipe(
    switchMapToFetchState(
      ([ plan, observedGroupId ]) => {
        const watchedGroupId = observedGroupId ?? undefined;
        const itemId = this.item().id;
        if (plan.action === 'fetch') {
          return this.fetchChildren(itemId, plan.attemptId, watchedGroupId).pipe(
            map(children => ({ children, attemptId: plan.attemptId } satisfies ReadyBody)),
          );
        }
        // plan.action === 'startAndFetch' (filter above excludes other actions)
        return this.resultActionsService.start(this.path().concat([ itemId ]), this.parentAttemptId()).pipe(
          switchMap(result => this.fetchChildren(itemId, result.attemptId, watchedGroupId).pipe(
            map(children => ({ children, attemptId: result.attemptId } satisfies ReadyBody)),
          )),
        );
      },
      { resetter: this.refresh$ },
    ),
  );

  refresh(): void {
    this.refresh$.next();
  }

  private fetchChildren(
    childId: string,
    attemptId: string,
    watchedGroupId: string | undefined,
  ): Observable<ItemChildWithAdditions[]> {
    return this.getItemChildrenService.get(childId, attemptId, { watchedGroupId }).pipe(
      map(children => children.map(mapChildWithAdditions)),
    );
  }
}
