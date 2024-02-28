import { ItemNavigationData } from 'src/app/data-access/item-navigation.service';
import { ItemType } from '../../items/models/item-type';
import { FullItemRoute } from '../routing/item-route';
import { ItemCorePerm } from '../../items/models/item-permissions';
import { ContentInfo, RoutedContentInfo } from './content-info';

export interface ItemInfo extends RoutedContentInfo {
  type: 'item',
  route: FullItemRoute,
  details?: ItemDetails,
  navData?: ItemNavigationData,
}

export interface ItemDetails {
  title: string|null,
  type: ItemType,
  permissions: ItemCorePerm,
  attemptId?: string,
  bestScore?: number,
  currentScore?: number,
  validated?: boolean,
}

export function isItemInfo(info: ContentInfo|null): info is ItemInfo {
  return info !== null && info.type === 'item';
}

export function isActivityInfo(info: ItemInfo|null): boolean {
  return info !== null && info.route.contentType === 'activity';
}

/**
 * Create an item info
 */
export function itemInfo(i: Omit<ItemInfo, 'type'>): ItemInfo {
  return { ...i, type: 'item' };
}
