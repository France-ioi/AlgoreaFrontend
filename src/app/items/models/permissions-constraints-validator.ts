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


export function permissionsConstraintsValidator(
  giverPermissions: ItemCorePerm,
  targetType: TypeFilter
): ValidatorFn {

  const formatValidationError = (permission: keyof ConstrainedPermissions) =>
    (constraintErrors: ConstraintError[]): { [key: string]: string[] } => {
      const e = constraintErrors.map(generateErrorMessage(targetType));
      return e.length ? { [permission]: e } : {};
    };


  return (group: AbstractControl): ValidationErrors | null => {

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
      ...formatValidationError('canView')(validateCanView(value, giverPermissions)),
      ...formatValidationError('canGrantView')(validateCanGrantView(value, giverPermissions)),
      ...formatValidationError('canWatch')(validateCanWatch(value, giverPermissions)),
      ...formatValidationError('canEdit')(validateCanEdit(value, giverPermissions)),
    };

    if (group.get('isOwner')?.dirty) {
      errors = { ...errors, ...formatValidationError('isOwner')(validateIsOwner(value, giverPermissions)) };
    }
    if (group.get('canMakeSessionOfficial')?.dirty) {
      errors = { ...errors, ...formatValidationError('canMakeSessionOfficial')(validateCanMakeSessionOfficial(value, giverPermissions)) };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
