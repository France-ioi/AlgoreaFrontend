import {
  ProgressSelectValue
} from 'src/app/modules/shared-components/components/collapsible-section/progress-select/progress-select.component';
import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { generateErrorMessage, permissionsInfoString } from './permissions-string';
import { TypeFilter } from '../components/composition-filter/composition-filter.component';
import {
  validateCanView,
  validateCanGrantView,
  validateCanWatch,
  validateCanEdit,
  validateIsOwner,
  validateCanMakeSessionOfficial,
  ConstraintError,
} from './item-permissions-constraints';
import {
  ITEMVIEWPERM_CONTENT,
  ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMVIEWPERM_INFO,
  ITEMVIEWPERM_NONE,
  ITEMVIEWPERM_SOLUTION
} from 'src/app/shared/models/domain/item-view-permission';
import {
  ITEMGRANTVIEWPERM_CONTENT,
  ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMGRANTVIEWPERM_ENTER,
  ITEMGRANTVIEWPERM_NONE,
  ITEMGRANTVIEWPERM_SOLUTION,
  ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT
} from 'src/app/shared/models/domain/item-grant-view-permission';
import {
  ITEMEDITPERM_ALL,
  ITEMEDITPERM_ALL_WITH_GRANT,
  ITEMEDITPERM_CHILDREN,
  ITEMEDITPERM_NONE
} from 'src/app/shared/models/domain/item-edit-permission';
import {
  ITEMWATCHPERM_NONE,
  ITEMWATCHPERM_RESULT,
  ITEMWATCHPERM_ANSWER,
  ITEMWATCHPERM_ANSWER_WITH_GRANT
} from 'src/app/shared/models/domain/item-watch-permission';
import { ItemCorePerm } from 'src/app/shared/models/domain/item-permissions';

export interface PermissionsDialogData {
  canViewValues: ProgressSelectValue<string>[],
  canGrantViewValues: ProgressSelectValue<string>[],
  canWatchValues: ProgressSelectValue<string>[],
  canEditValues: ProgressSelectValue<string>[],
  isOwnerDisabledTooltip?: string[],
  canMakeSessionOfficialDisabledTooltip?: string[],
}

function getTargetTypeString(targetType: TypeFilter): string {
  switch (targetType) {
    case 'Users':
      return $localize`The user`;
    case 'Groups':
      return $localize`The group`;
    case 'Teams':
      return $localize`The team`;
  }
}

export function generateCanViewValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canView']>[] {
  const targetTypeString = getTargetTypeString(targetType);
  return [
    {
      value: ITEMVIEWPERM_NONE,
      label: permissionsInfoString.canView.none,
      comment: $localize`${targetTypeString} can\'t see the item`
    },
    {
      value: ITEMVIEWPERM_INFO,
      label: permissionsInfoString.canView.info,
      comment: $localize`${targetTypeString} can see the item title and description, but not its content`,
    },
    {
      value: ITEMVIEWPERM_CONTENT,
      label: permissionsInfoString.canView.content,
      comment: $localize`${targetTypeString} can see the content of this item`,
    },
    {
      value: ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS,
      label: permissionsInfoString.canView.content_with_descendants,
      comment: $localize`${targetTypeString} can also see the content of this items descendants (when possible for this group)`,
    },
    {
      value: ITEMVIEWPERM_SOLUTION,
      label: permissionsInfoString.canView.solution,
      comment: $localize`${targetTypeString} can also see the solution of this items and its descendants (when possible for this group)`,
    }
  ];
}

function generateCanGrantViewValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canGrantView']>[] {
  const targetTypeString = getTargetTypeString(targetType);

  return [
    {
      value: ITEMGRANTVIEWPERM_NONE,
      label: permissionsInfoString.canGrantView.none,
      comment: $localize`${targetTypeString} can\'t grant any access to this item`
    },
    {
      value: ITEMGRANTVIEWPERM_ENTER,
      label: permissionsInfoString.canGrantView.enter,
      comment: $localize`${targetTypeString} can grant \'Can view: info\' and  \'Can enter\' access`,
    },
    {
      value: ITEMGRANTVIEWPERM_CONTENT,
      label: permissionsInfoString.canGrantView.content,
      comment: $localize`${targetTypeString} can also grant \'Can view: content\' access`,
    },
    {
      value: ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS,
      label: permissionsInfoString.canGrantView.content_with_descendants,
      comment: $localize`${targetTypeString} can also grant \'Can view: content and descendants\' access`,
    },
    {
      value: ITEMGRANTVIEWPERM_SOLUTION,
      label: permissionsInfoString.canGrantView.solution,
      comment: $localize`${targetTypeString} can also grant \'Can view: solution\' access`,
    },
    {
      value: ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT,
      label: permissionsInfoString.canGrantView.solution_with_grant,
      comment: $localize`${targetTypeString} can also grant \'Can grant view\' access`,
    }
  ];
}

function generateCanWatchValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canWatch']>[] {
  const targetTypeString = getTargetTypeString(targetType);

  return [
    {
      value: ITEMWATCHPERM_NONE,
      label: permissionsInfoString.canWatch.none,
      comment: $localize`${targetTypeString} can\'t watch the activity of others on this item`
    },
    {
      value: ITEMWATCHPERM_RESULT,
      label: permissionsInfoString.canWatch.result,
      comment:
        $localize`${targetTypeString} can view information about submissions and scores of others on this item, but not their answers`,
    },
    {
      value: ITEMWATCHPERM_ANSWER,
      label: permissionsInfoString.canWatch.answer,
      comment: $localize`${targetTypeString} can also look at other people\'s answers on this item`,
    },
    {
      value: ITEMWATCHPERM_ANSWER_WITH_GRANT,
      label: permissionsInfoString.canWatch.answer_with_grant,
      comment: $localize`${targetTypeString} can also grant \'Can watch\' access to others`,
    }
  ];
}

function generateCanEditValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canEdit']>[] {
  const targetTypeString = getTargetTypeString(targetType);

  return [
    {
      value: ITEMEDITPERM_NONE,
      label: permissionsInfoString.canEdit.none,
      comment: $localize`${targetTypeString} can\'t make any changes to this item`
    },
    {
      value: ITEMEDITPERM_CHILDREN,
      label: permissionsInfoString.canEdit.children,
      comment: $localize`${targetTypeString} can add children to this item and edit how permissions propagate to them`,
    },
    {
      value: ITEMEDITPERM_ALL,
      label: permissionsInfoString.canEdit.all,
      comment: $localize`${targetTypeString} can also edit the content of the item itself, but may not delete it`,
    },
    {
      value: ITEMEDITPERM_ALL_WITH_GRANT,
      label: permissionsInfoString.canEdit.all_with_grant,
      comment: $localize`${targetTypeString} can also give \'Can edit\' access to others`,
    }
  ];
}

export function generateValues(
  targetType: TypeFilter,
  receiverPermissions: GroupPermissions,
  giverPermissions: ItemCorePerm
): PermissionsDialogData {

  const formatErrors = (errors: ConstraintError[]): string[] | undefined => {
    const errorMessages = errors.map(error => generateErrorMessage(targetType)(error));
    return errorMessages.length ? errorMessages : undefined;
  };

  return {
    canViewValues: generateCanViewValues(targetType).map(val => {
      const errors = formatErrors(validateCanView({ ...receiverPermissions, canView: val.value }, giverPermissions));
      return errors ? { ...val, disabled: true, tooltip: errors } : val;
    }),

    canGrantViewValues: generateCanGrantViewValues(targetType).map(val => {
      const errors = formatErrors(validateCanGrantView({ ...receiverPermissions, canGrantView: val.value }, giverPermissions));
      return errors ? { ...val, disabled: true, tooltip: errors } : val;
    }),

    canWatchValues: generateCanWatchValues(targetType).map(val => {
      const errors = formatErrors(validateCanWatch({ ...receiverPermissions, canWatch: val.value }, giverPermissions));
      return errors ? { ...val, disabled: true, tooltip: errors } : val;
    }),

    canEditValues: generateCanEditValues(targetType).map(val => {
      const errors = formatErrors(validateCanEdit({ ...receiverPermissions, canEdit: val.value }, giverPermissions));
      return errors ? { ...val, disabled: true, tooltip: errors } : val;
    }),

    isOwnerDisabledTooltip: formatErrors(validateIsOwner({ ...receiverPermissions, isOwner: true }, giverPermissions)) || undefined,

    canMakeSessionOfficialDisabledTooltip: formatErrors(validateCanMakeSessionOfficial(
      { ...receiverPermissions, canMakeSessionOfficial: true }, giverPermissions
    )) || undefined,
  };
}
