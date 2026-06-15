import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetItemChildrenService } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../models/item-data';
import { DataColumn } from './group-progress-grid.types';

export function getGroupProgressGridColumns(
  getItemChildrenService: GetItemChildrenService,
  itemData: ItemData,
): Observable<DataColumn[]> {
  if (!itemData.currentResult?.attemptId) throw new Error('unexpected');
  return getItemChildrenService.get(itemData.item.id, itemData.currentResult.attemptId).pipe(
    map(items => [
      {
        id: itemData.item.id,
        requiresExplicitEntry: itemData.item.requiresExplicitEntry,
        title: itemData.item.string.title,
        type: itemData.item.type,
        permissions: itemData.item.permissions,
      },
      ...items.map(item => ({
        id: item.id,
        requiresExplicitEntry: !!item.requiresExplicitEntry,
        title: item.string.title,
        type: item.type,
        permissions: item.permissions,
      }))
    ]),
  );
}
