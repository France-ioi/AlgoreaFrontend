import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../helpers/item-type';
import { UrlCommand } from '../helpers/url';
import { urlArrayForRawItem } from '../routing/item-route';

@Pipe({ name: 'itemLink', pure: true })
export class ItemLinkPipe implements PipeTransform {
  transform({ id, type }: {id: string, type: ItemType}, page?: 'details' | 'edit'): UrlCommand {
    return urlArrayForRawItem(id, typeCategoryOfItem({ type }), page);
  }
}
