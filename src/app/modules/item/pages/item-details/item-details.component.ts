import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService, PageInfo } from 'src/app/shared/services/current-content.service';
import { ActivatedRoute } from '@angular/router';
import { itemFromDetailParams, NavItem, isPathGiven } from 'src/app/shared/services/nav-types';
import { GetBreadcrumbService, BreadcrumbItem } from 'src/app/modules/item/http-services/get-breadcrumb.service';
import { EMPTY, forkJoin, Observable, of, throwError } from 'rxjs';
import { map, mapTo, switchMap } from 'rxjs/operators';
import { ItemTabService } from '../../services/item-tab.service';
import { GetItemByIdService } from '../../http-services/get-item-by-id.service';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  providers: [ ItemTabService ]
})
export class ItemDetailsComponent implements OnDestroy {

  item$ = this.itemTabService.item$;
  state: 'loaded'|'loading'|'error' = 'loading';

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemTabService: ItemTabService,
    private currentContent: CurrentContentService,
    private getBreadcrumbService: GetBreadcrumbService,
    private getItemByIdService: GetItemByIdService,
    private resultActionsService: ResultActionsService,
  ) {
    activatedRoute.paramMap.subscribe((params) => {
      const navItem = itemFromDetailParams(params);
      if (navItem) {
        currentContent.setCurrent(navItem);
        this.fetchItem();
      }
    });
  }

  ngOnDestroy() {
    this.currentContent.setPageInfo(null);
  }

  private fetchItem() {
    if (!isPathGiven(this.activatedRoute.snapshot.paramMap)) {
      // TODO: handle no path given
      return;
    }
    const navItem = itemFromDetailParams(this.activatedRoute.snapshot.paramMap);
    if (!navItem) return; // unexpected anyway
    if (!navItem.attemptId && !navItem.parentAttemptId) {
      // TODO: handle no attempt given
      return;
    }
    this.state = 'loading';

    // do in parallel:
    // - fetch breadcrumb
    // - in serial:
    //   - fetch the item info
    //   - start a result on the item if required
    forkJoin([
      this.breadcumbRequest(navItem),
      this.getItemByIdService.get(navItem.itemId).pipe(
        switchMap((item) => {
          if (navItem.attemptId || item.requires_explicit_entry) return of(item);
          if (!navItem.parentAttemptId) return throwError(new Error('unexpected: no attempt provided')); /* cannot happen */
          return this.resultActionsService.start(navItem.itemPath.concat([navItem.itemId]), navItem.parentAttemptId).pipe(
            mapTo(item) // return the fetched item at the end
          );
        })
      )
    ])
    .subscribe(
      ([pageInfo, item]) => {
        // do the ui change only if the displayed item is still the same
        const nowNavItem = itemFromDetailParams(this.activatedRoute.snapshot.paramMap);
        if (nowNavItem && nowNavItem.itemId === navItem.itemId) {
          this.currentContent.setPageInfo(pageInfo);
          this.itemTabService.setItem(item);
          this.state = 'loaded';
        }
      },
      (_err) => {
        this.state = 'error';
      }
    );
  }

  private breadcumbRequest(navItem: NavItem): Observable<PageInfo> {
    const service = this.breadcrumbService(navItem);
    if (!service) return EMPTY; // unexpected as it should verified by the caller of this function
    return service.pipe(
      map((res) => {
        // TODO: handle forbidden currently (handle like no path given) -- while not handled: consider as the other errors
        if (res === 'forbidden') throw new Error('unhandled forbidden');
        return {
          category: 'Items',
          breadcrumb: res.map((el) => {
            return {
              title: el.title,
              attemptOrder: el.attemptCnt
            };
          }),
          currentPageIndex: res.length - 1
        };
      })
    );
  }

  /**
   * Return the observable to the suitable breadcrumb service depending on the navitem, or undefined if no attempt is given.
   */
  private breadcrumbService(navItem: NavItem): Observable<BreadcrumbItem[]|'forbidden'>|undefined {
    const fullPath = navItem.itemPath.concat([navItem.itemId]);
    if (navItem.attemptId) return this.getBreadcrumbService.getBreadcrumb(fullPath, navItem.attemptId);
    else if (navItem.parentAttemptId) return this.getBreadcrumbService.getBreadcrumbWithParentAttempt(fullPath, navItem.parentAttemptId);
    else return undefined;
  }

}
