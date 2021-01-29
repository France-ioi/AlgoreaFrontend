import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ItemRoute, isRouteWithAttempt, attemptParamName, parentAttemptParamName, pathParamName } from '../helpers/item-route';

@Injectable({
  providedIn: 'root'
})
export class ItemRouter {

  constructor(
    private router: Router,
  ) {}

  /**
   * Navigate to given item, on the path page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  navigateTo(item: ItemRoute, path?: 'edit'|'details'): void {
    void this.router.navigateByUrl(this.url(item, path));
  }

  /**
   * Navigate to the current page without path and attempt if we are on an item page.
   * If we are not on an item page, do nothing.
   */
  navigateToIncompleteItemOfCurrentPage(): void {
    const currentPage = this.currentItemPagePath();
    if (currentPage) void this.router.navigate(currentPage);
  }


  /**
   * Return a url to the given item, on the `path` page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  url(item: ItemRoute, path?: 'edit'|'details'): UrlTree {
    return this.router.createUrlTree(this.urlArray(item, path));
  }

  /**
   * Return a url array (`commands` array) to the given item, on the `path` page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  urlArray(item: ItemRoute, path?: 'edit'|'details'): any[] {
    const dest = path ? [ path ] : (this.currentItemSubPage() || [ 'details' ]);
    const params: {[k: string]: any} = {};
    if (isRouteWithAttempt(item)) params[attemptParamName] = item.attemptId;
    else params[parentAttemptParamName] = item.parentAttemptId;
    params[pathParamName] = item.path;
    return [ '/', 'items', 'by-id', item.id, params ].concat(dest);
  }


  /**
   * Extract (bit hacky) the item sub-page of the current page.
   * Return undefined if we are not on an "item" page
   */
  private currentItemSubPage(): string[]|undefined {
    return this.currentItemPagePath()?.slice(3);
  }

  private currentItemPagePath(): string[]|undefined {
    const currentPageUrlChildren = this.router.parseUrl(this.router.url).root.children;
    if (!('primary' in currentPageUrlChildren)) return undefined;
    const segments = currentPageUrlChildren['primary'].segments;
    if (segments.length < 3 || segments[0].path !== 'items' || segments[1].path !== 'by-id') return undefined;
    return segments.map(segment => segment.path);
  }

}
