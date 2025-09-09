import { Inject, Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { itemRouteWith, RawItemRoute, selectObservedGroupRouteAsItemRouteParameter } from './item-route';
import { APPCONFIG, AppConfig } from 'src/app/config';
import { itemRouteAsUrlCommand } from './item-route-serialization';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { UrlCommand } from 'src/app/utils/url';
import { ItemNavigationState } from './item-navigation-state';

interface NavigateOptions extends ItemNavigationState {
  page?: string[],
  navExtras?: NavigationExtras,
  useCurrentObservation?: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class ItemRouter {

  constructor(
    private router: Router,
    private store: Store,
    @Inject(APPCONFIG) private config: AppConfig,
  ) {}

  private currentPage = this.store.selectSignal(fromItemContent.selectActiveContentPage);
  private observedGroupRouteAsItemRouteParameter = this.store.selectSignal(selectObservedGroupRouteAsItemRouteParameter);

  /**
   * Navigate to given item, on the path page.
   * If page is not given and we are currently on an item page, use the same page. Otherwise, default to '/'.
   * If `keepCurrentObservation` is given, we use the observation value from the current page.
   */
  navigateTo(route: RawItemRoute, {
    page,
    navExtras,
    loadAnswerIdAsCurrent,
    useCurrentObservation = false,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    preventFullFrame = Boolean(typeof history.state === 'object' && history.state?.preventFullFrame),
  }: NavigateOptions = {}): void {
    if (useCurrentObservation) {
      route = itemRouteWith(route, this.observedGroupRouteAsItemRouteParameter());
    }
    const state: ItemNavigationState = { preventFullFrame, loadAnswerIdAsCurrent };
    void this.router.navigate(this.routeAsUrlCommand(route, page), { ...navExtras, state });
  }

  /**
   * Return a url to the given item, on the given page. Default to current page.
   * If page is not given and we are not currently on an item page, default to '/'.
   */
  url(item: RawItemRoute, page?: string[]): UrlTree {
    return this.router.createUrlTree(this.routeAsUrlCommand(item, page));
  }

  /**
   * Url of given route on the given page. Unlike `itemRouteAsUrlCommand`, default on the current page.
   * To prevent misusing it, this function is private: use `itemRouteAsUrlCommand` with the current page from the store instead.
   */
  private routeAsUrlCommand(item: RawItemRoute, page?: string[]): UrlCommand {
    return itemRouteAsUrlCommand(item, this.config.redirects, page ?? (this.currentPage() ?? undefined));
  }

}
