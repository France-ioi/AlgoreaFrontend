import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService, PageInfo } from 'src/app/shared/services/current-content.service';
import { ActivatedRoute } from '@angular/router';
import { itemFromDetailParams, NavItem, pathGiven } from 'src/app/shared/services/nav-types';
import { GetBreadcrumbService, BreadcrumbItem } from 'src/app/modules/item/http-services/get-breadcrumb.service';
import { EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss']
})
export class ItemDetailsComponent implements OnDestroy {

  constructor(
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private getBreadcrumbService: GetBreadcrumbService,
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
    if (!pathGiven(this.activatedRoute.snapshot.paramMap)) {
      // TODO: handle no path given
      return;
    }
    const navItem = itemFromDetailParams(this.activatedRoute.snapshot.paramMap);
    if (!navItem) return; // unexpected anyway
    if (!navItem.attemptId && !navItem.parentAttemptId) {
      // TODO: handle no attempt given
      return;
    }
    this.breadcumbRequest(navItem).subscribe((pageInfo) => {
      this.currentContent.setPageInfo(pageInfo);
    });
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
