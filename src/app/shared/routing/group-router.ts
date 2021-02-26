import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ContentRoute, pathParamName } from './content-route';

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
  navigateTo(group: ContentRoute, path?: 'edit'|'details'): void {
    void this.router.navigateByUrl(this.url(group, path));
  }

  /**
   * Navigate to the current page without path if we are on a group page.
   * If we are not on an group page, do nothing.
   */
  navigateToIncompleteGroupOfCurrentPage(): void {
    const currentPage = this.currentGroupPagePath();
    if (currentPage) void this.router.navigate(currentPage);
  }


  /**
   * Return a url to the given group, on the `path` page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to 'details'.
   */
  url(group: ContentRoute, path?: 'edit'|'details'): UrlTree {
    return this.router.createUrlTree(this.urlArray(group, path));
  }

  /**
   * Return a url array (`commands` array) to the given group, on the `path` page.
   * If page is not given and we are currently on a group page, use the same page. Otherwise, default to 'details'.
   */
  urlArray(group: ContentRoute, path?: 'edit'|'details'): any[] {
    const dest = path ? [ path ] : (this.currentGroupSubPage() || [ 'details' ]);
    const params: {[k: string]: any} = {};
    params[pathParamName] = group.path;
    return [ '/', 'groups', 'by-id', group.id, params ].concat(dest);
  }


  /**
   * Extract (bit hacky) the group sub-page of the current page.
   * Return undefined if we are not on a "group" page
   */
  private currentGroupSubPage(): string[]|undefined {
    return this.currentGroupPagePath()?.slice(3);
  }

  private currentGroupPagePath(): string[]|undefined {
    const currentPageUrlChildren = this.router.parseUrl(this.router.url).root.children;
    if (!('primary' in currentPageUrlChildren)) return undefined;
    const segments = currentPageUrlChildren['primary'].segments;
    if (segments.length < 3 || segments[0].path !== 'groups' || segments[1].path !== 'by-id') return undefined;
    return segments.map(segment => segment.path);
  }

}
