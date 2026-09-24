import {
  areGroupResultsExportNotificationsAvailable,
  canExportGroupProgressZip,
} from './group-progress-grid-zip-export.utils';
import { AppConfig } from 'src/app/config';
import { Group } from 'src/app/groups/models/group';
import { ItemWithWatchPerm } from 'src/app/items/models/item-watch-permission';

describe('group-progress-grid-zip-export.utils', () => {
  const group = {
    currentUserCanWatchMembers: true,
  } as Group;

  const item = {
    permissions: { canWatch: 'answer' },
  } as ItemWithWatchPerm;

  it('areGroupResultsExportNotificationsAvailable requires flag and slsApiUrl', () => {
    expect(areGroupResultsExportNotificationsAvailable({
      featureFlags: { enableNotifications: true },
      slsApiUrl: 'https://sls.example',
    } as AppConfig)).toBeTrue();

    expect(areGroupResultsExportNotificationsAvailable({
      featureFlags: { enableNotifications: false },
      slsApiUrl: 'https://sls.example',
    } as AppConfig)).toBeFalse();

    expect(areGroupResultsExportNotificationsAvailable({
      featureFlags: { enableNotifications: true },
      slsApiUrl: undefined,
    } as AppConfig)).toBeFalse();
  });

  it('canExportGroupProgressZip requires notificationsAvailable', () => {
    expect(canExportGroupProgressZip('Users', group, item, true)).toBeTrue();
    expect(canExportGroupProgressZip('Users', group, item, false)).toBeFalse();
    expect(canExportGroupProgressZip('Groups', group, item, true)).toBeFalse();
  });
});
