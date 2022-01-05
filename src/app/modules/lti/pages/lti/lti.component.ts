import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { ActivityNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { GetItemChildrenService, ItemChild } from 'src/app/modules/item/http-services/get-item-children.service';
import { GetItemPathService } from 'src/app/modules/item/http-services/get-item-path.service';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { fullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { LayoutService } from 'src/app/shared/services/layout.service';

enum LTIError {
  FetchError = 'fetch_error',
  NoItemOrExplicitEntryWithNoResult = 'no_item_or_explicit_entry_with_no_result',
  NoChild = 'no_child',
}
const noItemOrExplicitEntryWithNoResultError = new Error(LTIError.NoItemOrExplicitEntryWithNoResult);
const noChildError = new Error(LTIError.NoChild);

@Component({
  selector: 'alg-lti',
  templateUrl: './lti.component.html',
  styleUrls: [ './lti.component.scss' ],
})
export class LTIComponent implements OnDestroy {

  private contentId$ = this.activatedRoute.paramMap.pipe(
    map(params => {
      const contentId = params.get('contentId');
      if (!contentId) throw new Error('unexpected: contentId should be defined');
      return contentId;
    }),
  );
  readonly navigationData$ = this.contentId$.pipe(
    switchMap(contentId => this.getNavigationData(contentId).pipe(mapToFetchState())),
    shareReplay(1),
  );
  readonly error$ = this.navigationData$.pipe(
    map((state): LTIError | undefined => {
      if (!state.isError) return undefined;
      switch (state.error) {
        case noChildError: return LTIError.NoChild;
        case noItemOrExplicitEntryWithNoResultError: return LTIError.NoItemOrExplicitEntryWithNoResult;
        default: return LTIError.FetchError;
      }
    })
  );

  private subscriptions = [
    this.contentId$.subscribe(contentId => this.activityNavTreeService.navigationNeighborsRestrictedToDescendantOfElementId = contentId),
    this.navigationData$.pipe(readyData()).subscribe({
      next: ({ firstChild, path, attemptId }) => {
        const itemRoute = fullItemRoute('activity', firstChild.id, path, { parentAttemptId: attemptId });
        this.itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } });
      },
    }),
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private layoutService: LayoutService,
    private activityNavTreeService: ActivityNavTreeService,
    private getItemPathService: GetItemPathService,
    private resultActionsService: ResultActionsService,
    private getItemChildrenService: GetItemChildrenService,
  ) {
    this.layoutService.toggleTopRightControls(false);
    this.layoutService.toggleFullFrameContent(true, false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private getNavigationData(itemId: string): Observable<{ firstChild: ItemChild, path: string[], attemptId: string }> {
    const path$ = this.getItemPathService.getItemPath(itemId).pipe(map(path => [ ...path, itemId ]), shareReplay(1));

    const attemptId$ = path$.pipe(
      switchMap(path => this.resultActionsService.startWithoutAttempt(path)),
      catchError(err => {
        // If error is http forbidden, it PROBABLY means the item requires explicit entry.
        throw errorIsHTTPForbidden(err) ? noItemOrExplicitEntryWithNoResultError : err;
      }),
      shareReplay(1),
    );

    const firstChild$ = attemptId$.pipe(
      switchMap(attemptId => this.getItemChildrenService.get(itemId, attemptId)),
      map(([ firstChild ]) => {
        if (!firstChild) throw noChildError;
        return firstChild;
      }),
    );

    return forkJoin({
      attemptId: attemptId$,
      path: path$,
      firstChild: firstChild$,
    });
  }

}
