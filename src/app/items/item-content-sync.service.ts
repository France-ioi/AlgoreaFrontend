import { effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ContentDisplayType, LayoutService } from 'src/app/services/layout.service';
import { itemInfo } from 'src/app/models/content/item-info';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { routeWithSelfAttempt } from 'src/app/models/routing/item-route';
import { isATask } from 'src/app/items/models/item-type';
import { errorHasTag, errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { breadcrumbServiceTag } from './data-access/get-breadcrumb.service';
import { ItemTabs } from './item-tabs';
import { fromItemContent } from './store';

/**
 * Syncs item store state to CurrentContentService, LayoutService, and ItemTabs; handles breadcrumb redirect errors.
 * Owns fullFrameContent$ and editorUrl for the item-by-id page.
 */
@Injectable()
export class ItemContentSyncService {
  private store = inject(Store);
  private currentContent = inject(CurrentContentService);
  private itemRouter = inject(ItemRouter);
  private layoutService = inject(LayoutService);
  private itemTabs = inject(ItemTabs);

  readonly fullFrameContent$ = new BehaviorSubject<boolean>(false); // feeded by task change (below) and task api (item-content comp)
  readonly editorUrl = signal<string | undefined>(undefined);

  private itemDataState = this.store.selectSignal(fromItemContent.selectActiveContentData);
  private breadcrumbsState = this.store.selectSignal(fromItemContent.selectActiveContentBreadcrumbsState);
  private routeErrorHandlingState = this.store.selectSignal(fromItemContent.selectActiveContentRouteErrorHandlingState);
  private fullFrameContentSig = toSignal(this.fullFrameContent$, { initialValue: false });

  // Guards against service redirect loops (wrong path → strip path → recover path → wrong path again). Holds the id
  // of the item we redirected for: scoping per item keeps the guard from staying armed when the user navigates to
  // another item before the path recovery of the previous one settles. A scalar id is safe because only one content
  // is active at a time, so a genuine loop is always same-target.
  private redirectedForItemId: string | undefined;
  private lastTrackedRouteId: string | undefined;
  private lastTrackedRouteIdInitialized = false;
  private lastLayoutConfig: { id: string, display: ContentDisplayType } | undefined;

  constructor() {
    effect(() => {
      this.applyResetOnItemChange();
    });
    effect(() => {
      this.applyItemToCurrentContentSync();
    });
    effect(() => {
      this.applyBreadcrumbsErrorHandling();
    });
    effect(() => {
      this.applyRedirectGuardReset();
    });
    effect(() => {
      this.applyLayoutDisplaySync();
    });
  }

  private applyResetOnItemChange(): void {
    const state = this.itemDataState();
    if (state === null) return;

    const itemId = state.data?.route.id;
    if (!this.lastTrackedRouteIdInitialized) {
      this.lastTrackedRouteIdInitialized = true;
      this.lastTrackedRouteId = itemId;
      this.performItemChangeReset();
      return;
    }
    if (itemId === this.lastTrackedRouteId) return;
    this.lastTrackedRouteId = itemId;
    this.performItemChangeReset();
  }

  // Intentionally writes fullFrameContent$/editorUrl consumed by syncLayoutDisplay and the template.
  private performItemChangeReset(): void {
    this.fullFrameContent$.next(false);
    this.editorUrl.set(undefined);
    this.itemTabs.itemChanged();
  }

  private applyItemToCurrentContentSync(): void {
    const state = this.itemDataState();
    if (!state?.isReady) return;
    const data = state.data;
    this.currentContent.replace(itemInfo({
      route: routeWithSelfAttempt(data.route, data.currentResult?.attemptId),
      details: {
        title: data.item.string.title,
        type: data.item.type,
        permissions: data.item.permissions,
        attemptId: data.currentResult?.attemptId,
        bestScore: data.item.noScore ? undefined : (data.item.watchedGroup ? data.item.watchedGroup.averageScore : data.item.bestScore),
        currentScore: data.item.noScore ? undefined :
          (data.item.watchedGroup ? data.item.watchedGroup.averageScore : data.currentResult?.score),
        validated: data.item.noScore ? undefined :
          (data.item.watchedGroup ? data.item.watchedGroup.averageScore === 100 : data.currentResult?.validated),
        leftNavIcon: data.item.displaySettings.leftNavIcon ?? undefined,
      },
    }));
  }

  private applyBreadcrumbsErrorHandling(): void {
    const state = this.breadcrumbsState();
    if (state.isError) this.currentContent.clear();

    if (
      state.isError &&
      errorHasTag(state.error, breadcrumbServiceTag) &&
      (errorIsHTTPForbidden(state.error) || errorIsHTTPNotFound(state.error))
    ) {
      const route = state.identifier;
      if (!route) throw new Error('unexpected: the active breadcrumbs state should always have an identifier');
      if (this.redirectedForItemId === route.id) throw new Error('Too many redirections (unexpected)');
      this.redirectedForItemId = route.id;
      const routeWithoutPath = { ...route, path: undefined };
      this.itemRouter.navigateTo(routeWithoutPath, { navExtras: { replaceUrl: true }, useCurrentObservation: true });
    }
    if (state.isReady) this.redirectedForItemId = undefined;
  }

  private applyRedirectGuardReset(): void {
    // Recovering the path after our redirect failed, so no automatic navigation will follow: disarm the loop guard
    // so a later user-initiated navigation back to the failing route is treated as a new redirect, not as a loop.
    // Invariant: a route is either an error route (routeErrorHandlingState non-null) or a valid route whose
    // breadcrumbs may 403 — never both — so clearing here cannot defeat genuine-loop detection.
    if (this.routeErrorHandlingState()?.isError) this.redirectedForItemId = undefined;
  }

  private applyLayoutDisplaySync(): void {
    const state = this.itemDataState();
    if (!state?.isReady) return;
    const data = state.data;
    const fullFrame = this.fullFrameContentSig();
    const display = fullFrame
      ? ContentDisplayType.ShowFullFrame
      : (isATask(data.item) ? ContentDisplayType.Show : ContentDisplayType.Default);
    const id = data.route.id;
    if (this.lastLayoutConfig?.id === id && this.lastLayoutConfig?.display === display) return;
    this.lastLayoutConfig = { id, display };
    this.layoutService.configure({ contentDisplayType: display });
  }
}
