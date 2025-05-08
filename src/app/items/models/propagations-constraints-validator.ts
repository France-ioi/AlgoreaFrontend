import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ItemPermPropagations } from 'src/app/items/models/item-perm-propagation';
import { formatValidationError } from 'src/app/items/models/permissions-constraints-validator';
import {
  validateContentViewPropagation, validateEditPropagation,
  validateGrantViewPropagation,
  validateUpperViewLevelsPropagation, validateWatchPropagation
} from 'src/app/items/models/item-propagations-constraints';

export const propagationsConstraintsValidator = (
  giverPermissions: ItemCorePerm,
  itemPropagations: Partial<ItemPermPropagations>,
): ValidatorFn =>
  (group: AbstractControl<ItemPermPropagations>): ValidationErrors | null => {
    const formatValidationErrorFn = formatValidationError<ItemPermPropagations>('Users');
    const {
      contentViewPropagation: itemContentViewPropagation,
      upperViewLevelsPropagation: itemUpperViewLevelsPropagation,
      grantViewPropagation: itemGrantViewPropagation,
      watchPropagation: itemWatchPropagation,
      editPropagation: itemEditPropagation,
    } = itemPropagations;
    const {
      contentViewPropagation,
      upperViewLevelsPropagation,
      grantViewPropagation,
      watchPropagation,
      editPropagation,
    } = group.value;
    const errors: ValidationErrors = {
      ...formatValidationErrorFn('contentViewPropagation')(
        validateContentViewPropagation(giverPermissions, contentViewPropagation, itemContentViewPropagation)
      ),
      ...formatValidationErrorFn('upperViewLevelsPropagation')(
        validateUpperViewLevelsPropagation(giverPermissions, upperViewLevelsPropagation, itemUpperViewLevelsPropagation)
      ),
      ...formatValidationErrorFn('grantViewPropagation')(
        validateGrantViewPropagation(giverPermissions, grantViewPropagation, itemGrantViewPropagation)
      ),
      ...formatValidationErrorFn('watchPropagation')(
        validateWatchPropagation(giverPermissions, watchPropagation, itemWatchPropagation)
      ),
      ...formatValidationErrorFn('editPropagation')(
        validateEditPropagation(giverPermissions, editPropagation, itemEditPropagation)
      ),
    };
    return Object.keys(errors).length > 0 ? errors : null;
  };
