import { Component, OnDestroy } from '@angular/core';
import { ContentInfo, CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ActivatedRoute } from '@angular/router';
import { itemFromDetailParams, isPathGiven, itemDetailsRoute } from 'src/app/shared/services/nav-types';
import { filter, map } from 'rxjs/operators';
import { ItemDataSource, ItemData } from '../../services/item-datasource.service';
import { FetchError, Fetching, isReady, Ready } from 'src/app/shared/helpers/state';
import { Subscription } from 'rxjs';

const ItemBreadcrumbCat = 'Items';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  providers: [ ItemDataSource ]
})
export class ItemDetailsComponent implements OnDestroy {

  itemLoadingstate$ = this.itemDataSource.state$;
  item$ = this.itemDataSource.item$; // as template is not able to infer properly the type

  private subscription: Subscription; // subscription to be freed up on destroy

  constructor(
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
  ) {

    // on route change: refetch item if needed
    this.activatedRoute.paramMap.subscribe(params => {
      const navItem = itemFromDetailParams(params);
      if (!navItem) return; // unexpected as this component should not be routed if id is missing
      currentContent.setCurrent({ type: 'item', data: navItem, breadcrumbs: { category: ItemBreadcrumbCat, path: [], currentPageIdx: -1} });
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

    // on state change, update current content page info (for breadcrumb)
    this.subscription = this.itemDataSource.state$.pipe(
      filter<Ready<ItemData>|Fetching|FetchError,Ready<ItemData>>(isReady),
      map(state => this.contentInfoFromItemData(state.data))
    ).subscribe(p => this.currentContent.setCurrent(p));
  }

  contentInfoFromItemData(data: ItemData): ContentInfo {
    return {
      type: 'item',
      breadcrumbs: {
        category: ItemBreadcrumbCat,
        path: data.breadcrumbs.map((el, idx) => ({
          title: el.title,
          hintNumber: el.attemptCnt,
          navigateTo: itemDetailsRoute({
            itemId: el.itemId,
            attemptId: el.attemptId,
            itemPath: data.breadcrumbs.slice(0,idx).map(it => it.itemId),
          }),
        })),
        currentPageIdx: data.breadcrumbs.length - 1,
      },
      title: data.item.string.title === null ? undefined : data.item.string.title,
      data: data.nav,
    };
  }

  ngOnDestroy() {
    this.currentContent.setCurrent(null);
    this.subscription.unsubscribe();
  }

}
