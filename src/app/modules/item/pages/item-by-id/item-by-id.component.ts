import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from 'src/app/shared/helpers/state';
import { CurrentContentService, EditAction, isItemInfo, ItemInfo } from 'src/app/shared/services/current-content.service';
import { isPathGiven, itemDetailsRoute, itemFromDetailParams } from 'src/app/shared/services/nav-types';
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
      const navItem = itemFromDetailParams(params);
      if (!navItem) return; // unexpected as this component should not be routed if id is missing
      currentContent.current.next({
        type: 'item',
        data: { nav: navItem },
        breadcrumbs: { category: ItemBreadcrumbCat, path: [], currentPageIdx: -1 }
      } as ItemInfo);
      if (!isPathGiven(params)) {
        // TODO: handle no path given
        return;
      }
      if (!navItem.attemptId && !navItem.parentAttemptId) {
        // TODO: handle no attempt given
        return;
      }
      this.itemDataSource.fetchItem(navItem);
    });

    this.subscriptions.push(
      // on state change, update current content page info (for breadcrumb)
      this.itemDataSource.state$.pipe(
        filter<Ready<ItemData>|Fetching|FetchError,Ready<ItemData>>(isReady),
        map((state): ItemInfo => ({
          type: 'item',
          breadcrumbs: {
            category: ItemBreadcrumbCat,
            path: state.data.breadcrumbs.map((el, idx) => ({
              title: el.title,
              hintNumber: el.attemptCnt,
              navigateTo: itemDetailsRoute({
                itemId: el.itemId,
                attemptId: el.attemptId,
                itemPath: state.data.breadcrumbs.slice(0,idx).map(it => it.itemId),
              }),
            })),
            currentPageIdx: state.data.breadcrumbs.length - 1,
          },
          title: state.data.item.string.title === null ? undefined : state.data.item.string.title,
          data: {
            nav: state.data.nav,
            result: state.data.currentResult ? {
              attemptId: state.data.currentResult.attemptId,
              bestScore: state.data.item.best_score,
              currentScore: state.data.currentResult.score,
              validated: state.data.currentResult.validated,
            } : undefined
          },
        }))
      ).subscribe(p => this.currentContent.current.next(p)),

      this.currentContent.editAction$.pipe(
        filter(action => [ EditAction.StartEditing, EditAction.Cancel ].includes(action))
      ).subscribe(action => {
        const currentInfo = this.currentContent.current.value;
        if (isItemInfo(currentInfo)) {
          void this.router.navigate(itemDetailsRoute(currentInfo.data.nav, action === EditAction.StartEditing));
        }
      })
    );
  }

  ngOnDestroy() {
    this.currentContent.current.next(null);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}
