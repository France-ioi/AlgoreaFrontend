import { Group } from 'src/app/groups/models/group';
import { canCurrentUserWatchMembers } from 'src/app/groups/models/group-management';
import { canCurrentUserWatchAnswers, ItemWithWatchPerm } from 'src/app/items/models/item-watch-permission';
import { AppConfig } from 'src/app/config';
import { TypeFilter } from '../../models/composition-filter';
import { GroupProgressGridZipExportService } from './group-progress-grid-zip-export.service';

/** Async ZIP retrieval uses the notification bell, which requires notifications + SLS. */
export function areGroupResultsExportNotificationsAvailable(config: AppConfig): boolean {
  return config.featureFlags.enableNotifications && !!config.slsApiUrl;
}

export function canExportGroupProgressZip(
  filter: TypeFilter,
  group: Group,
  item: ItemWithWatchPerm,
  notificationsAvailable: boolean,
): boolean {
  return notificationsAvailable
    && filter === 'Users'
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
