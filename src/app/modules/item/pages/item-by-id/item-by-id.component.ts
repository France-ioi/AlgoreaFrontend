import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { appDefaultItemRoute, isItemRouteError, itemRouteFromParams } from 'src/app/shared/helpers/item-route';
import { FetchError, Fetching, isReady, Ready } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { CurrentContentService, EditAction, isItemInfo, ItemInfo } from 'src/app/shared/services/current-content.service';
import { ItemRouter } from 'src/app/shared/services/item-router';
import { GetItemPathService } from '../../http-services/get-item-path';
import { ItemDataSource, ItemData } from '../../services/item-datasource.service';

const itemBreadcrumbCat = 'Items';

/**
 * ItemByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-item-by-id',
  templateUrl: './item-by-id.component.html',
  styleUrls: [ './item-by-id.component.scss' ],
  providers: [ ItemDataSource ]
})
export class ItemByIdComponent implements OnDestroy {

  private subscriptions: Subscription[] = []; // subscriptions to be freed up on destroy

  constructor(
    private itemRouter: ItemRouter,
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private resultActionsService: ResultActionsService,
    private getItemPathService: GetItemPathService,
  ) {

    // on route change: refetch item if needed
    this.activatedRoute.paramMap.subscribe(params => {
      const item = itemRouteFromParams(params);
      if (isItemRouteError(item)) {
        // the case where id is missing is not handled as it is unexpected as this component would not be routed
        if (item.id) this.solveMissingPathAttempt(item.id, item.path);
        return;
      }
      // just publish to current content the new route we are navigating to (without knowing any info)
      currentContent.current.next({
        type: 'item',
        data: { route: item },
        breadcrumbs: { category: itemBreadcrumbCat, path: [], currentPageIdx: -1 }
      } as ItemInfo);
      // trigger the fetch of the item (which will itself re-update the current content)
      this.itemDataSource.fetchItem(item);
    });

    this.subscriptions.push(
      // on state change, update current content page info (for breadcrumb)
      this.itemDataSource.state$.pipe(
        filter<Ready<ItemData>|Fetching|FetchError,Ready<ItemData>>(isReady),
        map((state): ItemInfo => ({
          type: 'item',
          breadcrumbs: {
            category: itemBreadcrumbCat,
            path: state.data.breadcrumbs.map(el => ({
              title: el.title,
              hintNumber: el.attemptCnt,
              navigateTo: itemRouter.url(el.route),
            })),
            currentPageIdx: state.data.breadcrumbs.length - 1,
          },
          title: state.data.item.string.title === null ? undefined : state.data.item.string.title,
          data: {
            route: state.data.route,
            details: {
              title: state.data.item.string.title,
              type: state.data.item.type,
              attemptId: state.data.currentResult?.attemptId,
              bestScore: state.data.item.best_score,
              currentScore: state.data.currentResult?.score,
              validated: state.data.currentResult?.validated,
            }
          },
        }))
      ).subscribe(p => this.currentContent.current.next(p)),

      this.currentContent.editAction$.pipe(
        filter(action => [ EditAction.StartEditing, EditAction.StopEditing ].includes(action))
      ).subscribe(action => {
        const currentInfo = this.currentContent.current.value;
        if (isItemInfo(currentInfo)) {
          this.itemRouter.navigateTo(currentInfo.data.route, action === EditAction.StartEditing ? 'edit' : 'details');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
   * Will redirect when relevant data has been fetched.
   */
  private solveMissingPathAttempt(id: string, path?: string[]): void {

    const pathObservable = path ? of(path) : this.getItemPathService.getItemPath(id);
    pathObservable.pipe(
      switchMap(path => {
        // for empty path (root items), consider the item has a (fake) parent attempt id 0
        if (path.length === 0) return of({ id: id, path: path, parentAttemptId: defaultAttemptId });
        // else, will start all path but the current item
        return this.resultActionsService.startWithoutAttempt(path).pipe(
          map(attemptId => ({ id: id, path: path, parentAttemptId: attemptId }))
        );
      })
    ).subscribe(
      itemRoute => this.itemRouter.navigateTo(itemRoute),
      _err => this.itemRouter.navigateTo(appDefaultItemRoute())
    );
  }

}
