import { Injectable, inject } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { UrlCommand } from '../../utils/url';
import { GroupPage, groupPathRouterPrefix, groupPathRouterSubPrefix, RawGroupRoute, urlArrayForGroupRoute } from './group-route';

@Injectable({
  providedIn: 'root'
})
export class GroupRouter {
  private router = inject(Router);

  /**
   * Navigate to given group, on the path page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to '/'.
   */
  navigateTo(route: RawGroupRoute|GroupPage, options?: { page?: string[], navExtras?: NavigationExtras }): void {
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
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to '/'.
   */
  url(route: RawGroupRoute|GroupPage, page?: string[]): UrlTree {
    return this.router.createUrlTree(this.urlArray(route, page));
  }

  /**
   * Return a url array (`commands` array) to the given group, on the `path` page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to '/'.
   */
  urlArray(route: RawGroupRoute|GroupPage, page?: string[]): UrlCommand {
    return urlArrayForGroupRoute(route, page ?? this.currentGroupPage());
  }


  /**
   * Extract (bit hacky) the group sub-page of the current page.
   * Return undefined if we are not on a "group" page
   */
  private currentGroupPage(): string[] | undefined {
    const page = this.currentGroupPagePath()?.slice(3);
    if (!page || page.length === 0) return undefined;
    return page;
  }

  private currentGroupPagePath(): string[]|undefined {
    const { primary } = this.router.parseUrl(this.router.url).root.children;
    if (!primary) return undefined;
    const { segments } = primary;
    if (
      segments.length < 3 ||
      segments[0]?.path !== groupPathRouterPrefix ||
      segments[1]?.path !== groupPathRouterSubPrefix
    ) return undefined;
    return segments.map(segment => segment.path);
  }

}
