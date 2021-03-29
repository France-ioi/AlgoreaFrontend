import { ItemType } from '../../helpers/item-type';
import { ItemRoute } from '../../routing/item-route';
import { ContentInfo, RoutedContentInfo } from './content-info';

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
