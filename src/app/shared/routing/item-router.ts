import { Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { ensureDefined } from '../helpers/assert';
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
  navigateTo(item: RawItemRoute, {
    page,
    navExtras,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    preventFullFrame = Boolean(typeof history.state === 'object' && history.state?.preventFullFrame),
  }: NavigateOptions = {}): void {
    void this.router.navigateByUrl(this.url(item, page), { ...navExtras, state: { ...navExtras?.state, preventFullFrame } });
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
