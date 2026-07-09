import { Group } from 'src/app/groups/models/group';
import { canCurrentUserWatchMembers } from 'src/app/groups/models/group-management';
import { canCurrentUserWatchAnswers, ItemWithWatchPerm } from 'src/app/items/models/item-watch-permission';
import { TypeFilter } from '../../models/composition-filter';
import { GroupProgressGridZipExportService } from './group-progress-grid-zip-export.service';

export function canExportGroupProgressZip(
  filter: TypeFilter,
  group: Group,
  item: ItemWithWatchPerm,
): boolean {
  return filter === 'Users'
    && canCurrentUserWatchMembers(group)
    && canCurrentUserWatchAnswers(item);
}

export function triggerGroupProgressZipExport(
  zipExportService: GroupProgressGridZipExportService,
  groupId: string,
  parentItemId: string,
): void {
  zipExportService.export(groupId, parentItemId);
}
