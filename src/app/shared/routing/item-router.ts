import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ensureDefined } from '../helpers/null-undefined-predicates';
import { ItemRoute, itemRoutePrefixes, urlArrayForItemRoute } from './item-route';

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
  navigateTo(item: ItemRoute, page?: 'edit'|'details'): void {
    void this.router.navigateByUrl(this.urlTree(item, page));
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
   * Return a url to the given item, on the give page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  urlTree(item: ItemRoute, page?: 'edit'|'details'): UrlTree {
    return this.router.createUrlTree(this.urlArray(item, page));
  }

  /**
   * Return a url array (`commands` array) to the given item, on the given page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  urlArray(item: ItemRoute, page?: 'edit'|'details'): any[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return urlArrayForItemRoute(item, page ?? this.currentItemSubPage());
  }

  /**
   * Extract (bit hacky) the item sub-page of the current page.
   * Return undefined if we are not on an "item" page
   */
  private currentItemSubPage(): 'edit'|'details'|undefined {
    const subpagePart = this.currentItemPagePath()?.slice(3);
    if (!subpagePart || subpagePart.length === 0) return undefined;
    const page = subpagePart[0];
    return page === 'edit' || page === 'details' ? page : undefined;
  }

  private currentItemPagePath(): string[]|undefined {
    const { primary } = this.router.parseUrl(this.router.url).root.children;
    if (!primary) return undefined;
    const { segments } = primary;
    if (
      segments.length < 3 ||
      !itemRoutePrefixes.includes(ensureDefined(segments[0]).path) ||
      ensureDefined(segments[1]).path !== 'by-id'
    ) return undefined;
    return segments.map(segment => segment.path);
  }

}
