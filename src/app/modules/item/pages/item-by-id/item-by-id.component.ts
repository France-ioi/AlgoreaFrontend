import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { isItemRouteError, itemDetailsUrl, itemRouteFromParams, itemUrl } from 'src/app/shared/helpers/item-route';
import { FetchError, Fetching, isReady, Ready } from 'src/app/shared/helpers/state';
import { CurrentContentService, EditAction, isItemInfo, ItemInfo } from 'src/app/shared/services/current-content.service';
import { ItemDataSource, ItemData } from '../../services/item-datasource.service';

const ItemBreadcrumbCat = 'Items';

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
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
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
        breadcrumbs: { category: ItemBreadcrumbCat, path: [], currentPageIdx: -1 }
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
            category: ItemBreadcrumbCat,
            path: state.data.breadcrumbs.map(el => ({
              title: el.title,
              hintNumber: el.attemptCnt,
              navigateTo: itemDetailsUrl(el.route),
            })),
            currentPageIdx: state.data.breadcrumbs.length - 1,
          },
          title: state.data.item.string.title === null ? undefined : state.data.item.string.title,
          data: {
            route: state.data.route,
            details: {
              title: state.data.item.string.title,
              attemptId: state.data.currentResult?.attemptId,
              bestScore: state.data.item.best_score,
              currentScore: state.data.currentResult?.score,
              validated: state.data.currentResult?.validated,
            }
          },
        }))
      ).subscribe(p => this.currentContent.current.next(p)),

      this.currentContent.editAction$.pipe(
        filter(action => [ EditAction.StartEditing, EditAction.Cancel ].includes(action))
      ).subscribe(action => {
        const currentInfo = this.currentContent.current.value;
        if (isItemInfo(currentInfo)) {
          void this.router.navigate(itemUrl(currentInfo.data.route, action === EditAction.StartEditing ? 'edit' : 'details'));
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private solveMissingPathAttempt(id: string, _path?: string[]): void {
    // eslint-disable-next-line no-console
    console.log(`Error: missing path or attempt for :${id}`);
  }

}
