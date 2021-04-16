import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../helpers/item-type';
import { incompleteItemStringUrl } from '../routing/item-route';

function transform({ id, type }: {id: string, type: ItemType}): any {
  return incompleteItemStringUrl(id, typeCategoryOfItem({ type }));
}

@Pipe({ name: 'itemLink', pure: true })
export class ItemLinkPipe implements PipeTransform {
  transform = transform;
}
