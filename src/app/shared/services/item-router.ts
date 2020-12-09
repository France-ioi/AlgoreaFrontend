import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { ItemRoute, isRouteWithAttempt, attemptParamName, parentAttemptParamName, pathParamName } from '../helpers/item-route';

@Injectable({
  providedIn: 'root'
})
export class ItemRouter {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  /**
   * Navigate to given item, on the path page.
   * [not implemented yet] If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  navigateTo(item: ItemRoute, path?: 'edit'|'details'): void {
    void this.router.navigateByUrl(this.url(item, path));
  }

  /**
   * Navigate to an item with missing path and attempt
   */
  navigateToIncompleteItem(itemId: string): void {
    void this.router.navigate([ 'items', 'by-id', itemId ]);
  }

  /**
   * Return a url to given item, on the path page.
   * [not implemented yet] If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  url(item: ItemRoute, path?: 'edit'|'details'): UrlTree {
    const dest = path || 'details';
    const params: {[k: string]: any} = {};
    if (isRouteWithAttempt(item)) params[attemptParamName] = item.attemptId;
    else params[parentAttemptParamName] = item.parentAttemptId;
    params[pathParamName] = item.path;
    return this.router.createUrlTree([ 'items', 'by-id', item.id, params, dest ]);
  }

}
