import { ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { GroupPermissions } from 'src/app/data-access/group-permissions.service';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { TypeFilter } from './composition-filter';
import {
  validateCanView,
  validateCanGrantView,
  validateCanWatch,
  validateCanEdit,
  validateIsOwner,
  validateCanMakeSessionOfficial,
  ConstrainedPermissions,
  ConstraintError
} from './item-permissions-constraints';
import { generateErrorMessage } from './permissions-string';

// The function uses in permissions and propagations
export const formatValidationError = <T extends object>(targetType: TypeFilter) => (permission: keyof T) =>
  (constraintErrors: ConstraintError[]): { [key: string]: string[] } => {
    const e = constraintErrors.map(generateErrorMessage(targetType));
    return e.length ? { [permission]: e } : {};
  };

export function permissionsConstraintsValidator(
  giverPermissions: ItemCorePerm,
  targetType: TypeFilter
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const formatValidationErrorFn = formatValidationError<ConstrainedPermissions>(targetType);

    const value: GroupPermissions = {
      canView: group.get('canView')?.value as GroupPermissions['canView'],
      canGrantView: group.get('canGrantView')?.value as GroupPermissions['canGrantView'],
      canWatch: group.get('canWatch')?.value as GroupPermissions['canWatch'],
      canEdit: group.get('canEdit')?.value as GroupPermissions['canEdit'],
      canMakeSessionOfficial: group.get('canMakeSessionOfficial')?.value as GroupPermissions['canMakeSessionOfficial'],
      isOwner: group.get('isOwner')?.value as GroupPermissions['isOwner'],
      canEnterFrom: new Date(),
      canEnterUntil: new Date(),
    };

    let errors: ValidationErrors = {
      ...formatValidationErrorFn('canView')(validateCanView(value, giverPermissions)),
      ...formatValidationErrorFn('canGrantView')(validateCanGrantView(value, giverPermissions)),
      ...formatValidationErrorFn('canWatch')(validateCanWatch(value, giverPermissions)),
      ...formatValidationErrorFn('canEdit')(validateCanEdit(value, giverPermissions)),
    };

    if (group.get('isOwner')?.dirty) {
      errors = { ...errors, ...formatValidationErrorFn('isOwner')(validateIsOwner(value, giverPermissions)) };
    }
    if (group.get('canMakeSessionOfficial')?.dirty) {
      errors = { ...errors, ...formatValidationErrorFn('canMakeSessionOfficial')(validateCanMakeSessionOfficial(value, giverPermissions)) };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
