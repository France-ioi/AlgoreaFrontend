import { ProgressSelectValue } from 'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import {
  itemContentViewPermPropagationEnum,
  ItemPermPropagations,
  itemUpperViewLevelsPermPropagationEnum,
} from 'src/app/items/models/item-perm-propagation';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { ConstraintError } from 'src/app/items/models/item-permissions-constraints';
import {
  validateContentViewPropagation, validateEditPropagation,
  validateGrantViewPropagation,
  validateUpperViewLevelsPropagation, validateWatchPropagation
} from 'src/app/items/models/item-propagations-constraints';
import { generateErrorMessage } from 'src/app/items/models/permissions-string';

const contentViewPropagationNoneLabel = $localize`None`;
const contentViewPropagationInfoLabel = $localize`Info`;
const contentViewPropagationContentLabel = $localize`Content`;
const contentViewPropagationNoneComment = $localize`The user can\'t see the item.`;

export const contentViewPropagationValues: ProgressSelectValue<ItemPermPropagations['contentViewPropagation']>[] = [
  {
    value: itemContentViewPermPropagationEnum.none,
    label: contentViewPropagationNoneLabel,
    comment: contentViewPropagationNoneComment,
  },
  {
    value: itemContentViewPermPropagationEnum.as_info,
    label: contentViewPropagationInfoLabel,
    comment: $localize`The user can see the item title and description, but not its content. A "lock" is displayed next to its icon.`,
  },
  {
    value: itemContentViewPermPropagationEnum.as_content,
    label: contentViewPropagationContentLabel,
    comment: $localize`The group can see the content of this item`,
  },
];

const explicitEntryContentViewPropagationValues: ProgressSelectValue<ItemPermPropagations['contentViewPropagation']>[] = [
  {
    value: itemContentViewPermPropagationEnum.none,
    label: contentViewPropagationNoneLabel,
    comment: contentViewPropagationNoneComment,
  },
  {
    value: itemContentViewPermPropagationEnum.as_info,
    label: contentViewPropagationInfoLabel,
    // eslint-disable-next-line max-len
    comment: $localize`The user can see the item title and description. For manual-entry activities such as this one, it allows the user to start participation manually (the user may still need additional enter permissions).`,
  },
  {
    value: itemContentViewPermPropagationEnum.as_content,
    label: contentViewPropagationContentLabel,
    comment: $localize`The group can start the manual-entry activity without any additional conditions.`,
  },
];

export const upperViewLevelsPropagationValues: ProgressSelectValue<ItemPermPropagations['upperViewLevelsPropagation']>[] = [
  {
    value: itemUpperViewLevelsPermPropagationEnum.use_content_view_propagation,
    label: $localize`Use \'content\' propagation`,
    // eslint-disable-next-line max-len
    comment: $localize`The user gets the same permissions as if he had "content" permission on the chapter (applies the rule from "Propagation of "content" view permission").`,
  },
  {
    value: itemUpperViewLevelsPermPropagationEnum.as_content_with_descendants,
    label: $localize`Content with descendants`,
    comment: $localize`The user gets the "content with descendants" permission`,
  },
  {
    value: itemUpperViewLevelsPermPropagationEnum.as_is,
    label: $localize`Solution`,
    comment: $localize`The user gets the same view permission on the content as he has on the chapter.`,
  },
];

const formatErrors = (errors: ConstraintError[]): string[] | undefined => {
  const errorMessages = errors.map(error => generateErrorMessage('Users')(error));
  return errorMessages.length ? errorMessages : undefined;
};

export interface ItemPermPropagationsValuesData {
  contentViewPropagationValues: ProgressSelectValue<ItemPermPropagations['contentViewPropagation']>[],
  upperViewLevelsPropagationValues: ProgressSelectValue<ItemPermPropagations['upperViewLevelsPropagation']>[],
  grantViewPropagationDisabledTooltip: string[] | undefined,
  watchPropagationDisabledTooltip: string[] | undefined,
  editPropagationDisabledTooltip: string[] | undefined,
}

export const generatePropagationsValuesWithValidation = (
  giverPermissions: ItemCorePerm,
  itemPropagations: Partial<ItemPermPropagations>,
  requiresExplicitEntry = false,
): ItemPermPropagationsValuesData => {
  const baseContentViewPropagationValues = requiresExplicitEntry
    ? explicitEntryContentViewPropagationValues
    : contentViewPropagationValues;

  return {
    contentViewPropagationValues: baseContentViewPropagationValues.map(val => {
      const errors = formatErrors(
        validateContentViewPropagation(giverPermissions, val.value, itemPropagations.contentViewPropagation)
      );
      return errors ? { ...val, disabled: true, tooltip: errors } : val;
    }),
    upperViewLevelsPropagationValues: upperViewLevelsPropagationValues.map(val => {
      const errors = formatErrors(
        validateUpperViewLevelsPropagation(giverPermissions, val.value, itemPropagations.upperViewLevelsPropagation)
      );
      return errors ? { ...val, disabled: true, tooltip: errors } : val;
    }),
    grantViewPropagationDisabledTooltip: formatErrors(
      validateGrantViewPropagation(giverPermissions, true, itemPropagations.grantViewPropagation)
    ),
    watchPropagationDisabledTooltip: formatErrors(validateWatchPropagation(giverPermissions, true, itemPropagations.watchPropagation)),
    editPropagationDisabledTooltip: formatErrors(validateEditPropagation(giverPermissions, true, itemPropagations.editPropagation)),
  };
};
