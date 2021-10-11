import { ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { PermissionsInfo, canGrantViewValues, canViewValues } from './item-permissions';

function atLeast<T extends readonly string[]>(values: T, val: T[number], ref: T[number]): boolean {
  return values.indexOf(val) >= values.indexOf(ref);
}

function validateCanView(receiverPermissions: GroupPermissions, giverPermissions: PermissionsInfo): ValidationErrors {

  if (receiverPermissions.canView === 'info' &&
  !atLeast(canGrantViewValues, giverPermissions.canGrantView, 'enter')) {
    return { canView: [ 'You need at least can_grant_view >= enter' ] };
  }
  if (receiverPermissions.canView === 'content' &&
  !atLeast(canGrantViewValues, giverPermissions.canGrantView, 'content')) {
    return { canView: [ 'You need at least can_grant_view >= content' ] };
  }
  if (receiverPermissions.canView === 'content_with_descendants' &&
  !atLeast(canGrantViewValues, giverPermissions.canGrantView, 'content_with_descendants')) {
    return { canView: [ 'You need at least can_grant_view >= content_with_descendants' ] };
  }
  if (receiverPermissions.canView === 'solution' &&
  !atLeast(canGrantViewValues, giverPermissions.canGrantView, 'solution')) {
    return { canView: [ 'You need at least can_grant_view >= solution' ] };
  }
  return {};
}

function validateCanGrantView(receiverPermissions: GroupPermissions, giverPermissions: PermissionsInfo): ValidationErrors {

  if (receiverPermissions.canGrantView === 'none') return {};

  const errors: string[] = [];

  if (receiverPermissions.canGrantView === 'solution_with_grant') {
    if (!giverPermissions.isOwner) errors.push('You need to be owner of this item');
    if (!atLeast(canViewValues, receiverPermissions.canView, 'solution')) errors.push('This user needs at least can_view >= solution');
  } else {

    if (!(giverPermissions.canGrantView === 'solution_with_grant')) {
      errors.push('You need can_grant_view = solution_with_grant');
    }

    if (receiverPermissions.canGrantView === 'enter' && !atLeast(canViewValues, receiverPermissions.canView, 'info')) {
      errors.push('This user needs at least can_view >= info');
    }

    if (receiverPermissions.canGrantView === 'content' && !atLeast(canViewValues, receiverPermissions.canView, 'content')) {
      errors.push('This user needs at least content');
    }
    if (receiverPermissions.canGrantView === 'content_with_descendants' &&
        !atLeast(canViewValues, receiverPermissions.canView, 'content_with_descendants')) {
      errors.push('This user needs at least content_with_descendants');
    }
    if (receiverPermissions.canGrantView === 'solution' && !atLeast(canViewValues, receiverPermissions.canView, 'solution')) {
      errors.push('This user needs at least solution');
    }
  }

  return { canGrantView: errors.length === 0 ? undefined : errors };
}

function validateCanWatch(receiverPermissions: GroupPermissions, giverPermissions: PermissionsInfo): ValidationErrors {

  if (receiverPermissions.canWatch === 'none') return {};

  const errors: string[] = [];

  // For all canWatch except 'none'
  if (!atLeast(canViewValues, receiverPermissions.canView, 'content')) {
    errors.push('This user needs at least canView >= content');
  }

  if (receiverPermissions.canWatch === 'answer_with_grant' && !giverPermissions.isOwner) {
    errors.push('You need to be owner of this item');
  } else {

    // if receiverPermissions.canWatch is 'result' or 'answer'
    if (!(giverPermissions.canWatch === 'answer_with_grant')) {
      errors.push('You need at canWatch == answer_with_grant');
    }
  }

  return { canWatch: errors.length === 0 ? undefined : errors };
}

function validateCanEdit(receiverPermissions: GroupPermissions, giverPermissions: PermissionsInfo): ValidationErrors {

  if (receiverPermissions.canEdit === 'none') return {};

  const errors: string[] = [];

  // For all can_edit except 'none'
  if (!atLeast(canViewValues, receiverPermissions.canView, 'content')) {
    errors.push('This user needs at least canView >= content');
  }

  if (receiverPermissions.canEdit === 'all_with_grant' && !giverPermissions.isOwner) {
    errors.push('You need to be owner of this item');
  } else {

    // if receiverPermissions.canEdit is 'children' or 'all_with_grant'
    if (!(giverPermissions.canEdit === 'all_with_grant')) {
      errors.push('You need at canEdit == all_with_grant');
    }
  }

  return { canEdit: errors.length === 0 ? undefined : errors };
}

function validateCanMakeSessionOfficial(
  previousValue: boolean,
  receiverPermissions: GroupPermissions,
  giverPermissions: PermissionsInfo
): ValidationErrors {
  const errors: string[] = [];

  if (receiverPermissions.canMakeSessionOfficial && !previousValue) {
    if (!giverPermissions.isOwner) {
      errors.push('You need to be owner of this item');
    }
    if (!atLeast(canViewValues, receiverPermissions.canView, 'content')) {
      errors.push('This user needs can_view >= content');
    }
  }

  return { canMakeSessionOfficial: errors.length === 0 ? undefined : errors };
}

function validateIsOwner(
  previousValue: boolean,
  receiverPermissions: GroupPermissions,
  giverPermissions: PermissionsInfo
): ValidationErrors {

  if (receiverPermissions.isOwner && !previousValue && !giverPermissions.isOwner) {
    return { isOwner: [ 'You need to be owner of this item' ] };
  }
  return {};
}


export function permissionsConstraintsValidator(
  receiverPermissions: GroupPermissions,
  giverPermissions: PermissionsInfo
): ValidatorFn {

  return (group: AbstractControl): ValidationErrors|null => {

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

    const errors: ValidationErrors = {
      ...validateCanView(value, giverPermissions),
      ...validateCanGrantView(value, giverPermissions),
      ...validateCanWatch(value, giverPermissions),
      ...validateCanEdit(value, giverPermissions),
      ...validateCanMakeSessionOfficial(receiverPermissions.canMakeSessionOfficial, value, giverPermissions),
      ...validateIsOwner(receiverPermissions.canMakeSessionOfficial, value, giverPermissions),
    };

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
