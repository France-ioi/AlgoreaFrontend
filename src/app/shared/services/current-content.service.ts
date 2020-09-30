import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavItem } from './nav-types';

export interface ContentBreadcrumb {
  category: string,
  path: {
    title: string,
    hintNumber?: number,
    navigateTo?: any[],
  }[],
  currentPageIdx: number, // index of the current page in the path array, -1 to select the category
}

export interface ContentInfo {
  type: string
  breadcrumbs?: ContentBreadcrumb,
  editing?: boolean, // undefined: not allowed, otherwise: whether the current page is current being edited
  title?: string, // page title
  data?: any,
}

export interface ItemInfo extends ContentInfo { type: 'item', data: NavItem }
export interface GroupInfo extends ContentInfo { type: 'group' }

export function isItemInfo(info: ContentInfo): info is ItemInfo {
  return info.type === 'item';
}

export function isGroupInfo(info: ContentInfo): info is GroupInfo {
  return info.type === 'group';
}

/**
 * Use this service to track what's the current item display in the content (right) pane.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrentContentService {
  private current = new BehaviorSubject<ContentInfo|null>(null);
  currentContent$ = this.current.asObservable();

  setCurrent(content: ContentInfo|null) {
    this.current.next(content);
  }

  currentContent(): ContentInfo|null {
    return this.current.value;
  }

}
