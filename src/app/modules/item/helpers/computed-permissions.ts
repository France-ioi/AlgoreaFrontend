import {
  ProgressSelectValue
} from '../../shared-components/components/collapsible-section/progress-select/progress-select.component';
import { TypeFilter } from './composition-filter';
import { PermissionsDialogData } from './permissions-texts';
import { GroupComputedPermissions, GroupPermissions } from '../../../shared/http-services/group-permissions.service';
import { itemViewPermValues } from '../../../shared/models/domain/item-view-permission';
import { itemGrantViewPermValues } from '../../../shared/models/domain/item-grant-view-permission';
import { itemWatchPermValues } from '../../../shared/models/domain/item-watch-permission';
import { itemEditPermValues } from '../../../shared/models/domain/item-edit-permission';

export function hasHigherPermission<T extends readonly string[]>(permissionsSortedByLoosest: T, permission: T[number]) {
  return (minimumPermission: T[number]): boolean =>
    permissionsSortedByLoosest.indexOf(permission) > permissionsSortedByLoosest.indexOf(minimumPermission);
}

function getComputeValues(
  values: ProgressSelectValue<string>[],
  currentValue: string,
  computedValue: string,
  targetType: TypeFilter,
): ProgressSelectValue<string>[] {
  const currentValueIndex = values.findIndex(value => value.value === currentValue);
  const computedValueIndex = values.findIndex(value => value.value === computedValue);

  values = values.map((value, index) => {
    if (index > currentValueIndex && index <= computedValueIndex) {
      return {
        ...value,
        selected: true,
        tooltip: [
          ...(value.tooltip || []),
          targetType === 'Users'
            ? $localize`This user has this permission via one of the other group he is member of, or one of their ancestors.`
            : $localize`This group has this permission via one of one of its ancestor group.`
        ],
      };
    }
    return value;
  });

  return values;
}

export function withComputePermissions(
  permissionsDialogData: PermissionsDialogData,
  permissions: Omit<GroupPermissions,'canEnterFrom'|'canEnterUntil'>,
  receiverPermissions: Omit<GroupPermissions,'canEnterFrom'|'canEnterUntil'>,
  computedPermissions: Omit<GroupComputedPermissions,'canEnterFrom'|'canEnterUntil'>,
  targetType: TypeFilter,
): PermissionsDialogData {
  const giverCanAtLeastView = hasHigherPermission(itemViewPermValues, computedPermissions.canView);
  const giverCanAtLeastGrantView = hasHigherPermission(itemGrantViewPermValues, computedPermissions.canGrantView);
  const giverCanAtLeastWatch = hasHigherPermission(itemWatchPermValues, computedPermissions.canWatch);
  const giverCanAtLeastEdit = hasHigherPermission(itemEditPermValues, computedPermissions.canEdit);

  if (giverCanAtLeastView(permissions.canView)) {
    permissionsDialogData.canViewValues = getComputeValues(
      permissionsDialogData.canViewValues,
      receiverPermissions.canView,
      computedPermissions.canView,
      targetType,
    );
  }

  if (giverCanAtLeastGrantView(permissions.canGrantView)) {
    permissionsDialogData.canGrantViewValues = getComputeValues(
      permissionsDialogData.canGrantViewValues,
      receiverPermissions.canGrantView,
      computedPermissions.canGrantView,
      targetType,
    );
  }

  if (giverCanAtLeastWatch(permissions.canWatch)) {
    permissionsDialogData.canWatchValues = getComputeValues(
      permissionsDialogData.canWatchValues,
      receiverPermissions.canWatch,
      computedPermissions.canWatch,
      targetType,
    );
  }

  if (giverCanAtLeastEdit(permissions.canEdit)) {
    permissionsDialogData.canEditValues = getComputeValues(
      permissionsDialogData.canEditValues,
      receiverPermissions.canEdit,
      computedPermissions.canEdit,
      targetType,
    );
  }

  return permissionsDialogData;
}

