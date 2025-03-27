import {
  itemContentViewPermPropagationEnum, itemContentViewPermPropagationValues,
  ItemPermPropagations, itemUpperViewLevelsPermPropagationEnum, itemUpperViewLevelsPermPropagationValues
} from 'src/app/items/models/item-perm-propagation';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { ConstraintError, genError, hasAtLeastPermission } from 'src/app/items/models/item-permissions-constraints';
import { ItemGrantViewPerm, itemGrantViewPermValues } from 'src/app/items/models/item-grant-view-permission';
import { ItemWatchPerm, itemWatchPermValues } from 'src/app/items/models/item-watch-permission';
import { ItemEditPerm, itemEditPermValues } from 'src/app/items/models/item-edit-permission';

export const validateContentViewPropagation = (
  giverPermissions: ItemCorePerm,
  value: ItemPermPropagations['contentViewPropagation'],
  itemValue?: ItemPermPropagations['contentViewPropagation'],
): ConstraintError[] => {
  const giverHasAtLeast = hasAtLeastPermission(itemGrantViewPermValues, giverPermissions.canGrantView);
  const itemValueAtLeast = itemValue && hasAtLeastPermission(itemContentViewPermPropagationValues, itemValue);

  if (value === itemContentViewPermPropagationEnum.as_info
    && (itemValueAtLeast && !itemValueAtLeast(itemContentViewPermPropagationEnum.as_info))
    && !giverHasAtLeast(ItemGrantViewPerm.Enter)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.Enter, 'giver', 'atLeast') ];
  } else if (value === itemContentViewPermPropagationEnum.as_content
    && (itemValueAtLeast && !itemValueAtLeast(itemContentViewPermPropagationEnum.as_content))
    && !giverHasAtLeast(ItemGrantViewPerm.Content)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.Content, 'giver', 'atLeast') ];
  } else {
    return [];
  }
};

export const validateUpperViewLevelsPropagation = (
  giverPermissions: ItemCorePerm,
  value: ItemPermPropagations['upperViewLevelsPropagation'],
  itemValue?: ItemPermPropagations['upperViewLevelsPropagation'],
): ConstraintError[] => {
  const giverHasAtLeast = hasAtLeastPermission(itemGrantViewPermValues, giverPermissions.canGrantView);
  const itemValueAtLeast = itemValue && hasAtLeastPermission(itemUpperViewLevelsPermPropagationValues, itemValue);

  if (value === itemUpperViewLevelsPermPropagationEnum.as_content_with_descendants
    && (itemValueAtLeast && !itemValueAtLeast(itemUpperViewLevelsPermPropagationEnum.as_content_with_descendants))
    && !giverHasAtLeast(ItemGrantViewPerm.ContentWithDescendants)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.ContentWithDescendants, 'giver', 'atLeast') ];
  } else if (value === itemUpperViewLevelsPermPropagationEnum.as_is
    && (itemValueAtLeast && !itemValueAtLeast(itemUpperViewLevelsPermPropagationEnum.as_is))
    && !giverHasAtLeast(ItemGrantViewPerm.Solution)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.Solution, 'giver', 'atLeast') ];
  } else {
    return [];
  }
};

export const validateGrantViewPropagation = (
  giverPermissions: ItemCorePerm,
  value: ItemPermPropagations['grantViewPropagation'],
  itemValue?: ItemPermPropagations['grantViewPropagation'],
): ConstraintError[] => {
  const giverHasAtLeast = hasAtLeastPermission(itemGrantViewPermValues, giverPermissions.canGrantView);
  if (value && !itemValue && !giverHasAtLeast(ItemGrantViewPerm.SolutionWithGrant)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.SolutionWithGrant, 'giver', 'atLeast') ];
  } else {
    return [];
  }
};

export const validateWatchPropagation = (
  giverPermissions: ItemCorePerm,
  value: ItemPermPropagations['watchPropagation'],
  itemValue?: ItemPermPropagations['watchPropagation'],
): ConstraintError[] => {
  const giverHasAtLeast = hasAtLeastPermission(itemWatchPermValues, giverPermissions.canWatch);
  if (value && !itemValue && !giverHasAtLeast(ItemWatchPerm.AnswerWithGrant)) {
    return [ genError('canWatch')(ItemWatchPerm.AnswerWithGrant, 'giver', 'atLeast') ];
  } else {
    return [];
  }
};

export const validateEditPropagation = (
  giverPermissions: ItemCorePerm,
  value: ItemPermPropagations['editPropagation'],
  itemValue?: ItemPermPropagations['editPropagation'],
): ConstraintError[] => {
  const giverHasAtLeast = hasAtLeastPermission(itemEditPermValues, giverPermissions.canEdit);
  if (value && !itemValue && !giverHasAtLeast(ItemEditPerm.AllWithGrant)) {
    return [ genError('canEdit')(ItemEditPerm.AllWithGrant, 'giver', 'atLeast') ];
  } else {
    return [];
  }
};
