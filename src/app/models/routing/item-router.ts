import { Inject, Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { RawItemRoute } from './item-route';
import { AnswerId } from '../ids';
import { loadAnswerAsCurrentAsBrowserState } from 'src/app/items/utils/load-answer-as-current-state';
import { APPCONFIG, AppConfig } from 'src/app/app.config';
import { itemRouteAsUrlCommand } from './item-route-serialization';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { UrlCommand } from 'src/app/utils/url';

interface NavigateOptions {
  page?: string[],
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
    private store: Store,
    @Inject(APPCONFIG) private config: AppConfig,
  ) {}

  private currentPage = this.store.selectSignal(fromItemContent.selectActiveContentPage);

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
    void this.router.navigate(this.routeAsUrlCommand(item, page), { ...navExtras, state: {
      ...navExtras?.state,
      preventFullFrame,
      ...(loadAnswerIdAsCurrent ? loadAnswerAsCurrentAsBrowserState(loadAnswerIdAsCurrent) : {}),
    } }
    );
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
