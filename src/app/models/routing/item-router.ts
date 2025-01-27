import { Injectable } from '@angular/core';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { RawItemRoute } from './item-route';
import { AnswerId } from '../ids';
import { loadAnswerAsCurrentAsBrowserState } from 'src/app/items/utils/load-answer-as-current-state';
import { itemRouteAsUrlCommand } from './item-route-serialization';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';

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
  url(item: RawItemRoute, page?: string[]): UrlTree {
    const currentPage = this.currentPage() ?? undefined;
    return this.router.createUrlTree(itemRouteAsUrlCommand(item, page ?? currentPage));
  }

}
