import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { GetItemChildrenService, ItemChild } from 'src/app/modules/item/http-services/get-item-children.service';
import { GetItemPathService } from 'src/app/modules/item/http-services/get-item-path.service';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { errorState } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { fullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { LayoutService } from 'src/app/shared/services/layout.service';

const explicitEntryWithNoResultError = new Error('no result');
const noChildError = new Error('no first child');
const noContentIdError = new Error('no content id');
type LTIError = 'no content id' | 'fetch error' | 'explicit entry with no result' | 'no child';

@Component({
  selector: 'alg-lti',
  templateUrl: './lti.component.html',
  styleUrls: [ './lti.component.scss' ],
})
export class LTIComponent {

  readonly navigationData$ = this.activatedRoute.queryParamMap.pipe(
    switchMap(queryParams => {
      const contentId = queryParams.get('content_id');
      if (!contentId) return of(errorState(noContentIdError));
      return this.getNavigationData(contentId).pipe(mapToFetchState());
    }),
    shareReplay(1),
  );
  readonly error$ = this.navigationData$.pipe(
    map((state): LTIError | undefined => {
      if (!state.isError) return undefined;
      switch (state.error) {
        case noContentIdError: return 'no content id';
        case noChildError: return 'no child';
        case explicitEntryWithNoResultError: return 'explicit entry with no result';
        default: return 'fetch error';
      }
    })
  );

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private layoutService: LayoutService,
    private getItemPathService: GetItemPathService,
    private resultActionsService: ResultActionsService,
    private getItemChildrenService: GetItemChildrenService,
  ) {
    this.layoutService.toggleTopRightControls(false);
    this.layoutService.toggleFullFrameContent(true, false);

    this.navigationData$.pipe(readyData()).subscribe({
      next: ({ itemId, firstChild, path, attemptId }) => {
        const itemRoute = fullItemRoute('activity', firstChild.id, [ ...path, itemId ], { attemptId });
        this.itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } });
      },
    });
  }

  private getNavigationData(itemId: string): Observable<{ itemId: string, firstChild: ItemChild, path: string[], attemptId: string }> {
    const path$ = this.getItemPathService.getItemPath(itemId).pipe(shareReplay(1));

    const attemptId$ = path$.pipe(
      switchMap(path => this.resultActionsService.startWithoutAttempt(path)),
      catchError(err => {
        // If error is http forbidden, it PROBABLY means the item requires explicit entry.
        throw errorIsHTTPForbidden(err) ? explicitEntryWithNoResultError : err;
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
      itemId: of(itemId),
      attemptId: attemptId$,
      path: path$,
      firstChild: firstChild$,
    });
  }

}
