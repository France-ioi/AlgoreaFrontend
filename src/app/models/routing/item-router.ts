import { Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { ensureDefined } from '../../utils/assert';
import { RawItemRoute } from './item-route';
import { AnswerId } from '../ids';
import { loadAnswerAsCurrentAsBrowserState } from 'src/app/items/utils/load-answer-as-current-state';
import { itemCategoryFromPrefix, itemRouteAsUrlCommand } from './item-route-serialization';
import { isString } from 'src/app/utils/type-checkers';

interface NavigateOptions {
  page?: string|string[],
  preventFullFrame?: boolean,
  loadAnswerIdAsCurrent?: AnswerId,
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
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to '/'.
   */
  navigateTo(item: RawItemRoute, {
    page,
    navExtras,
    loadAnswerIdAsCurrent,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    preventFullFrame = Boolean(typeof history.state === 'object' && history.state?.preventFullFrame),
  }: NavigateOptions = {}): void {
    void this.router.navigateByUrl(this.url(item, page), { ...navExtras, state: {
      ...navExtras?.state,
      preventFullFrame,
      ...(loadAnswerIdAsCurrent ? loadAnswerAsCurrentAsBrowserState(loadAnswerIdAsCurrent) : {}),
    } }
    );
  }

  /**
   * Return a url to the given item, on the given page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to '/'.
   */
  url(item: RawItemRoute, page?: string|string[]): UrlTree {
    const pageArray = isString(page) ? [ page ]: page;
    return this.router.createUrlTree(itemRouteAsUrlCommand(item, pageArray ?? this.currentItemPage()));
  }

  /**
   * Extract (bit hacky) the item page from what is currently displayed.
   * Return undefined if we are not on an "item" page
   */
  currentItemPage(): string[]|undefined {
    const page = this.currentItemPagePath()?.slice(2);
    return page && page.length > 0 ? page : undefined;
  }

  private currentItemPagePath(): string[]|undefined {
    const { primary } = this.router.parseUrl(this.router.url).root.children;
    if (!primary) return undefined;
    const { segments } = primary;
    if (
      segments.length < 2 ||
      itemCategoryFromPrefix(ensureDefined(segments[0]).path) === null
    ) return undefined;
    return segments.map(segment => segment.path);
  }

}
