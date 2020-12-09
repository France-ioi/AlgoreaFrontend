import { Injectable, OnDestroy } from '@angular/core';
import { UrlTree } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { ItemRoute } from '../helpers/item-route';
import { ItemType } from '../helpers/item-type';

export interface ContentBreadcrumb {
  category: string,
  path: {
    title: string,
    hintNumber?: number,
    navigateTo?: UrlTree,
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

export interface ItemInfo extends ContentInfo {
  type: 'item',
  data: { route: ItemRoute, details?: ItemDetails }
}

export interface ItemDetails {
  title: string|null,
  type: ItemType,
  attemptId?: string,
  bestScore?: number,
  currentScore?: number,
  validated?: boolean,
}

type GroupId = string;

export interface GroupInfo extends ContentInfo {
  id: GroupId,
  type: 'group'
}

export function isItemInfo(info: ContentInfo|null): info is ItemInfo {
  return info !== null && info.type === 'item';
}

export function isGroupInfo(info: ContentInfo|null): info is GroupInfo {
  return info !== null && info.type === 'group';
}

export type EditState = 'non-editable'|'editable'|'editing'|'editing-noaction'; // editingNoAction is for temporary disabled actions
export enum EditAction { StartEditing, StopEditing }

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

  /* the current state of editing */
  editState = new BehaviorSubject<EditState>('non-editable');
  editState$ = this.editState.asObservable();

  /* passing of edit actions */
  editAction = new Subject<EditAction>();
  editAction$ = this.editAction.asObservable();

  ngOnDestroy(): void {
    this.current.complete();
    this.editState.complete();
    this.editAction.complete();
  }
}
