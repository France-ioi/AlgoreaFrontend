import { ItemFound } from 'src/app/modules/item/http-services/search-item.service';
import { ActivityType, ItemType } from 'src/app/shared/helpers/item-type';
import { NewContentType } from '../../../shared-components/components/add-content/add-content.component';
import { allowedNewActivityTypes, skillNewType } from '../../../../shared/helpers/new-item-types';

type AssociatedItemId = string;

export interface NoAssociatedItem { tag: 'no-item' }

export interface NewAssociatedItem { tag: 'new-item', name: string, itemType: ItemType }

export interface ExistingAssociatedItem { tag: 'existing-item', id: AssociatedItemId }

export function isExistingAssociatedItem(item: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem): item is ExistingAssociatedItem {
  return item.tag === 'existing-item';
}

export function isNewAssociatedItem(item: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem): item is NewAssociatedItem {
  return item.tag === 'new-item';
}

export function isActivityFound(itemFound: ItemFound<ItemType>): itemFound is ItemFound<ActivityType> {
  return itemFound.type !== 'Skill';
}

export function getAllowedTypesForNewAssociatedItem(contentType: 'activity' | 'skill'): NewContentType<ItemType>[] {
  return contentType === 'activity' ? allowedNewActivityTypes : [ skillNewType ];
}
