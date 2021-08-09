import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../helpers/item-type';
import { rawItemStringUrl } from '../routing/item-route';

@Pipe({ name: 'itemLink', pure: true })
export class ItemLinkPipe implements PipeTransform {
  transform({ id, type }: {id: string, type: ItemType}, page?: 'details' | 'edit'): string {
    return rawItemStringUrl(id, typeCategoryOfItem({ type }), page);
  }
}
