import { Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { ensureDefined } from '../helpers/null-undefined-predicates';
import { itemCategoryFromPrefix, RawItemRoute, urlArrayForItemRoute } from './item-route';

interface NavigateOptions {
  page?: string|string[],
  preventFullFrame?: boolean,
  navExtras?: NavigationExtras,
}

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
  navigateTo(item: RawItemRoute, { page, navExtras, preventFullFrame = false }: NavigateOptions = {}): void {
    void this.router.navigateByUrl(this.url(item, page), { ...navExtras, state: { ...navExtras?.state, preventFullFrame } });
  }

  /**
   * Navigate to the current page without path and attempt if we are on an item page.
   * If we are not on an item page, do nothing.
   */
  navigateToRawItemOfCurrentPage(): void {
    const currentPage = this.currentItemPagePath();
    if (currentPage) void this.router.navigate(currentPage);
  }


  /**
   * Return a url to the given item, on the given page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to 'details'.
   */
  url(item: RawItemRoute, page?: string|string[]): UrlTree {
    return this.router.createUrlTree(urlArrayForItemRoute(item, page ?? this.currentItemPage()));
  }

  /**
   * Extract (bit hacky) the item page from what is currently displayed.
   * Return undefined if we are not on an "item" page
   */
  private currentItemPage(): string[]|undefined {
    const page = this.currentItemPagePath()?.slice(3);
    return page && page.length > 0 ? page : undefined;
  }

  private currentItemPagePath(): string[]|undefined {
    const { primary } = this.router.parseUrl(this.router.url).root.children;
    if (!primary) return undefined;
    const { segments } = primary;
    if (
      segments.length < 3 ||
      itemCategoryFromPrefix(ensureDefined(segments[0]).path) === null ||
      ensureDefined(segments[1]).path !== 'by-id'
    ) return undefined;
    return segments.map(segment => segment.path);
  }

}
