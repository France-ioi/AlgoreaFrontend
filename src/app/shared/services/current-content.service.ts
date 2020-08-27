import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NavItem, NavGroup } from './nav-types';

/**
 * Use this service to track what's the current item display in the content (right) pane.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrentContentService {
  private currentContent = new BehaviorSubject<NavItem|NavGroup|null>(null);

  constructor() { }

  setCurrent(item: NavItem) {
    this.currentContent.next(item);
  }

  item(): Observable<NavItem|null> {
    return this.currentContent.pipe(
      map((content) => {
        if (content === null) return null;
        return ((content as NavItem).itemId !== undefined) ? content as NavItem : null;
      }),
      distinctUntilChanged() // mainly to avoid sending multiple null
    );
  }
}
