import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NavItem, NavGroup } from './nav-types';

export interface PageInfo {
  category: string,
  breadcrumb: {
    title: string,
    attemptOrder?: number,
  }[],
  currentPageIndex: number, // index of the current page in the breadcrumb array
}

/**
 * Use this service to track what's the current item display in the content (right) pane.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrentContentService {
  private currentContent = new BehaviorSubject<NavItem|NavGroup|null>(null);
  private currentPageInfo = new BehaviorSubject<PageInfo|null>(null);

  constructor() { }

  setCurrent(item: NavItem) {
    this.currentContent.next(item);
  }

  setPageInfo(info: PageInfo|null) {
    this.currentPageInfo.next(info);
  }

  item(): Observable<NavItem|null> {
    return this.currentContent.pipe(
      map(content => {
        if (content === null) return null;
        return ((content as NavItem).itemId !== undefined) ? content as NavItem : null;
      }),
      distinctUntilChanged() // mainly to avoid sending multiple null
    );
  }

  pageInfo(): Observable<PageInfo|null> {
    return this.currentPageInfo.asObservable();
  }
}
