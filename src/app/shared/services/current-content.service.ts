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

export function isItemInfo(info: ContentInfo|null): info is ItemInfo {
  return info !== null && info.type === 'item';
}

export function isGroupInfo(info: ContentInfo|null): info is GroupInfo {
  return info !== null && info.type === 'group';
}

/**
 * Use this service to track what's the current item display in the content (right) pane.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrentContentService {
  /* info about the currently displayed content */
  current = new BehaviorSubject<ContentInfo|null>(null);
  currentContent$ = this.current.asObservable();

}
