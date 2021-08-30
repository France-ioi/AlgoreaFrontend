import { Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { GroupRoute, urlArrayForGroupRoute } from './group-route';

@Injectable({
  providedIn: 'root'
})
export class GroupRouter {

  constructor(
    private router: Router,
  ) {}

  /**
   * Navigate to given group, on the path page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to 'details'.
   */
  navigateTo(route: GroupRoute, options?: { page?: 'edit'|'details'; navExtras?: NavigationExtras }): void {
    void this.router.navigateByUrl(this.url(route, options?.page), options?.navExtras);
  }

  /**
   * Navigate to the current page without path if we are on a group page.
   * If we are not on an group page, do nothing.
   */
  navigateToRawGroupOfCurrentPage(): void {
    const currentPage = this.currentGroupPagePath();
    if (currentPage) void this.router.navigate(currentPage);
  }


  /**
   * Return a url to the given group, on the `path` page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to 'details'.
   */
  url(route: GroupRoute, page?: 'edit'|'details'): UrlTree {
    return this.router.createUrlTree(this.urlArray(route, page));
  }

  /**
   * Return a url array (`commands` array) to the given group, on the `path` page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to 'details'.
   */
  urlArray(route: GroupRoute, page?: 'edit'|'details'): any[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return urlArrayForGroupRoute(route, page ?? this.currentGroupSubPage());
  }


  /**
   * Extract (bit hacky) the group sub-page of the current page.
   * Return undefined if we are not on a "group" page
   */
  private currentGroupSubPage(): 'edit'|'details'|undefined {
    const subpagePart = this.currentGroupPagePath()?.slice(3);
    if (!subpagePart || subpagePart.length === 0) return undefined;
    const page = subpagePart[0];
    return page === 'edit' || page === 'details' ? page : undefined;
  }

  private currentGroupPagePath(): string[]|undefined {
    const { primary } = this.router.parseUrl(this.router.url).root.children;
    if (!primary) return undefined;
    const { segments } = primary;
    if (segments.length < 3 || segments[0]?.path !== 'groups' || segments[1]?.path !== 'by-id') return undefined;
    return segments.map(segment => segment.path);
  }

}
