import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, switchMapTo } from 'rxjs/operators';
import { GetItemByIdService, Item } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { GetItemChildrenService, ItemChild } from 'src/app/modules/item/http-services/get-item-children.service';
import { GetItemPathService } from 'src/app/modules/item/http-services/get-item-path.service';
import { GetResultsService, Result } from 'src/app/modules/item/http-services/get-results.service';
import { bestAttemptFromResults, implicitResultStart } from 'src/app/shared/helpers/attempts';
import { ensureDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { fullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { LayoutService } from 'src/app/shared/services/layout.service';

const explicitEntryWithNoResultError = new Error('no result');
const noChildError = new Error('no first child');
const noContentIdError = new Error('no content id');
const fetchError = new Error('fetch error');
type LTIError = 'no content id' | 'fetch error' | 'explicit entry with no result' | 'no child';

@Component({
  selector: 'alg-lti',
  templateUrl: './lti.component.html',
  styleUrls: [ './lti.component.scss' ],
})
export class LTIComponent {

  error?: LTIError;

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private layoutService: LayoutService,
    private getItemByIdService: GetItemByIdService,
    private getResultsService: GetResultsService,
    private getItemPathService: GetItemPathService,
    private resultActionsService: ResultActionsService,
    private getItemChildrenService: GetItemChildrenService,
  ) {
    this.layoutService.toggleTopRightControls(false);
    this.layoutService.toggleFullFrameContent(true, false);

    this.activatedRoute.queryParamMap.pipe(
      map(queryParams => {
        const contentId = queryParams.get('content_id');
        if (!contentId) throw noContentIdError;
        return contentId;
      }),
      switchMap(contentId => this.getNavigationData(contentId).pipe(
        catchError(err => of(err instanceof Error ? err : fetchError)),
      )),
    ).subscribe({
      next: dataOrError => {
        if (dataOrError instanceof Error) {
          if (dataOrError === noChildError) this.error = 'no child';
          else if (dataOrError === explicitEntryWithNoResultError) this.error = 'explicit entry with no result';
          else this.error = 'fetch error';
          return;
        }
        const { firstChild , path, result } = dataOrError;
        const itemRoute = fullItemRoute('activity', firstChild.id, path, { attemptId: result.attemptId });
        this.itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } });
      },
    });
  }

  private getNavigationData(itemId: string): Observable<{ firstChild: ItemChild, path: string[], result: Result }> {
    const item$ = this.getItemByIdService.get(itemId).pipe(shareReplay(1));
    const path$ = this.getItemPathService.getItemPath(itemId).pipe(shareReplay(1));
    const results$ = this.getResultsService.get(itemId, { attempt_id: '0' });

    const bestResult$ = forkJoin([ item$, results$ ]).pipe(
      switchMap(([ item, results ]) => {
        if (results.length === 0 && !implicitResultStart(item)) throw explicitEntryWithNoResultError;
        return path$.pipe(switchMap(path => this.getBestResultOrStartOne(item, results, path)));
      }),
      shareReplay(1),
    );

    const children$ = bestResult$.pipe(switchMapTo(this.getItemChildrenService.get(itemId, '0')));

    return children$.pipe(
      switchMap(([ firstChild ]) => {
        if (!firstChild) throw noChildError;
        return forkJoin([ path$, bestResult$ ]).pipe(map(([ path, result ]) => ({ firstChild, path, result })));
      }),
    );
  }

  private getBestResultOrStartOne(item: Item, results: Result[], path: string[]): Observable<Result> {
    const bestResult = bestAttemptFromResults(results);
    if (bestResult) return of(bestResult);

    return this.resultActionsService.startWithoutAttempt([ ...path, item.id ]).pipe(
      switchMap(() => this.getResultsService.get(item.id, { attempt_id: '0' })),
      map(([ first ]) => ensureDefined(first, 'unexpected: there should be a result after its creation')),
    );
  }

}
