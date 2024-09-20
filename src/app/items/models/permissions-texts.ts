import {
  ProgressSelectValue
} from 'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import { GroupPermissions } from 'src/app/data-access/group-permissions.service';
import { generateErrorMessage, permissionsInfoString } from './permissions-string';
import { TypeFilter } from './composition-filter';
import {
  validateCanView,
  validateCanGrantView,
  validateCanWatch,
  validateCanEdit,
  validateIsOwner,
  validateCanMakeSessionOfficial,
  ConstraintError,
  validateCanEnter,
} from './item-permissions-constraints';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';

export interface PermissionsDialogData {
  canViewValues: ProgressSelectValue<string>[],
  canGrantViewValues: ProgressSelectValue<string>[],
  canWatchValues: ProgressSelectValue<string>[],
  canEditValues: ProgressSelectValue<string>[],
  isOwnerDisabledTooltip?: string[],
  canMakeSessionOfficialDisabledTooltip?: string[],
  canEnterDisabledTooltip?: string[],
}

export function getTargetTypeString(targetType: TypeFilter): string {
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
      value: ItemViewPerm.None,
      label: permissionsInfoString.canView.none,
      comment: $localize`${targetTypeString} can\'t see the item`
    },
    {
      value: ItemViewPerm.Info,
      label: permissionsInfoString.canView.info,
      comment: $localize`${targetTypeString} can see the item title and description, but not its content`,
    },
    {
      value: ItemViewPerm.Content,
      label: permissionsInfoString.canView.content,
      comment: $localize`${targetTypeString} can see the content of this item`,
    },
    {
      value: ItemViewPerm.ContentWithDescendants,
      label: permissionsInfoString.canView.content_with_descendants,
      comment: $localize`${targetTypeString} can also see the content of this items descendants (when possible for this group)`,
    },
    {
      value: ItemViewPerm.Solution,
      label: permissionsInfoString.canView.solution,
      comment: $localize`${targetTypeString} can also see the solution of this items and its descendants (when possible for this group)`,
    }
  ];
}

export function generateCanGrantViewValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canGrantView']>[] {
  const targetTypeString = getTargetTypeString(targetType);

  return [
    {
      value: ItemGrantViewPerm.None,
      label: permissionsInfoString.canGrantView.none,
      comment: $localize`${targetTypeString} can\'t grant any access to this item`
    },
    {
      value: ItemGrantViewPerm.Enter,
      label: permissionsInfoString.canGrantView.enter,
      comment: $localize`${targetTypeString} can grant \'Can view: info\' and  \'Can enter\' access`,
    },
    {
      value: ItemGrantViewPerm.Content,
      label: permissionsInfoString.canGrantView.content,
      comment: $localize`${targetTypeString} can also grant \'Can view: content\' access`,
    },
    {
      value: ItemGrantViewPerm.ContentWithDescendants,
      label: permissionsInfoString.canGrantView.content_with_descendants,
      comment: $localize`${targetTypeString} can also grant \'Can view: content and descendants\' access`,
    },
    {
      value: ItemGrantViewPerm.Solution,
      label: permissionsInfoString.canGrantView.solution,
      comment: $localize`${targetTypeString} can also grant \'Can view: solution\' access`,
    },
    {
      value: ItemGrantViewPerm.SolutionWithGrant,
      label: permissionsInfoString.canGrantView.solution_with_grant,
      comment: $localize`${targetTypeString} can also grant \'Can grant view\' access`,
    }
  ];
}

export function generateCanWatchValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canWatch']>[] {
  const targetTypeString = getTargetTypeString(targetType);

  return [
    {
      value: ItemWatchPerm.None,
      label: permissionsInfoString.canWatch.none,
      comment: $localize`${targetTypeString} can\'t watch the activity of others on this item`
    },
    {
      value: ItemWatchPerm.Result,
      label: permissionsInfoString.canWatch.result,
      comment:
        $localize`${targetTypeString} can view information about submissions and scores of others on this item, but not their answers`,
    },
    {
      value: ItemWatchPerm.Answer,
      label: permissionsInfoString.canWatch.answer,
      comment: $localize`${targetTypeString} can also look at other people\'s answers on this item`,
    },
    {
      value: ItemWatchPerm.AnswerWithGrant,
      label: permissionsInfoString.canWatch.answer_with_grant,
      comment: $localize`${targetTypeString} can also grant \'Can watch\' access to others`,
    }
  ];
}

export function generateCanEditValues(
  targetType: TypeFilter,
): ProgressSelectValue<GroupPermissions['canEdit']>[] {
  const targetTypeString = getTargetTypeString(targetType);

  return [
    {
      value: ItemEditPerm.None,
      label: permissionsInfoString.canEdit.none,
      comment: $localize`${targetTypeString} can\'t make any changes to this item`
    },
    {
      value: ItemEditPerm.Children,
      label: permissionsInfoString.canEdit.children,
      comment: $localize`${targetTypeString} can add children to this item and edit how permissions propagate to them`,
    },
    {
      value: ItemEditPerm.All,
      label: permissionsInfoString.canEdit.all,
      comment: $localize`${targetTypeString} can also edit the content of the item itself, but may not delete it`,
    },
    {
      value: ItemEditPerm.AllWithGrant,
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

    canEnterDisabledTooltip: formatErrors(validateCanEnter(giverPermissions)),
  };
}
