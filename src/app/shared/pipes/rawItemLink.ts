import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../helpers/item-type';
import { UrlCommand } from '../helpers/url';
import { rawItemRoute, urlArrayForItemRoute } from '../routing/item-route';

/**
 * Functions using item route should always be preferred to raw item.
 * Using raw item means further requests will be required to fetch path and attempt information.
 */
@Pipe({ name: 'rawItemLink', pure: true })
export class RawItemLinkPipe implements PipeTransform {
  transform({ id, type }: {id: string, type: ItemType}, page?: string|string[], answerId?: string): UrlCommand {
    return urlArrayForItemRoute(rawItemRoute(typeCategoryOfItem({ type }), id, answerId), page);
  }
}
