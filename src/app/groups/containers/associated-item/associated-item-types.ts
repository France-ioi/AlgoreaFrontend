import { ItemFound } from 'src/app/data-access/search-item.service';
import { ActivityType, isASkill, ItemType } from 'src/app/items/models/item-type';

type AssociatedItemId = string;

export interface NoAssociatedItem { tag: 'no-item' }

export interface NewAssociatedItem { tag: 'new-item', name: string, url?: string, itemType: ItemType }

export interface ExistingAssociatedItem { tag: 'existing-item', id: AssociatedItemId }

export function isExistingAssociatedItem(item: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem): item is ExistingAssociatedItem {
  return item.tag === 'existing-item';
}

export function isNewAssociatedItem(item: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem): item is NewAssociatedItem {
  return item.tag === 'new-item';
}

export function isActivityFound(itemFound: ItemFound<ItemType>): itemFound is ItemFound<ActivityType> {
  return !isASkill(itemFound);
}
