import { Injectable, OnDestroy } from '@angular/core';
import { UrlTree } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ContentRoute } from '../routing/content-route';
import { ItemRoute } from '../routing/item-route';
import { ItemType } from '../helpers/item-type';

export interface ContentBreadcrumb {
  category: string,
  path: {
    title: string,
    hintNumber?: number,
    navigateTo?: UrlTree|(() => UrlTree),
  }[],
  currentPageIdx: number, // index of the current page in the path array, -1 to select the category
}

export interface ContentInfo {
  type: string
  breadcrumbs?: ContentBreadcrumb,
  editing?: boolean, // undefined: not allowed, otherwise: whether the current page is current being edited
  title?: string, // page title
  route?: ContentRoute,
  details?: any
}

export interface RoutedContentInfo extends ContentInfo {
  route: ContentRoute
}

export interface ItemInfo extends RoutedContentInfo {
  type: 'item',
  route: ItemRoute,
  details?: ItemDetails
}

export interface ItemDetails {
  title: string|null,
  type: ItemType,
  attemptId?: string,
  bestScore?: number,
  currentScore?: number,
  validated?: boolean,
}

export interface GroupInfo extends RoutedContentInfo {
  type: 'group',
  route: ContentRoute
}

export function isItemInfo(info: ContentInfo|null): info is ItemInfo {
  return info !== null && info.type === 'item';
}

export function isActivityInfo(info: ItemInfo|null): boolean {
  return info !== null && info.route.contentType === 'activity';
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
export class CurrentContentService implements OnDestroy {
  /* info about the currently displayed content */
  current = new BehaviorSubject<ContentInfo|null>(null);
  currentContent$ = this.current.asObservable();

  ngOnDestroy(): void {
    this.current.complete();
  }
}
