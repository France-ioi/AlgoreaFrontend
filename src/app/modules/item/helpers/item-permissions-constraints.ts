import { ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { PermissionsInfo, canGrantViewValues, canViewValues, permissionsInfoString } from './item-permissions';
import { TypeFilter } from '../components/composition-filter/composition-filter.component';
import { PermissionsDialogData } from '../components/permissions-edit-dialog/permissions-edit-dialog.component';
import {
  generateCanViewValues,
  generateCanGrantViewValues,
  generateCanWatchValues,
  generateCanEditValues
} from '../components/permissions-edit-dialog/permissions-edit-dialog-texts';

const bolden = (text: string): string => `<b>${text}</b>`;

function hasAtLeastPermission<T extends readonly string[]>(permissionsSortedByLoosest: T, permission: T[number]) {
  return (minimumPermission: T[number]): boolean =>
    permissionsSortedByLoosest.indexOf(permission) >= permissionsSortedByLoosest.indexOf(minimumPermission);
}

export function validateCanView(
  receiverPermissions: Pick<GroupPermissions, 'canView'>,
  giverPermissions: Pick<PermissionsInfo, 'canGrantView'>
): { canView?: string[] } {

  const giverCanAtLeastGrantView = hasAtLeastPermission(canGrantViewValues, giverPermissions.canGrantView);

  if (receiverPermissions.canView === 'info' && !giverCanAtLeastGrantView('enter')) {
    return { canView: [
      `You need ${bolden(permissionsInfoString.canGrantView.string)} to be at least ${bolden(permissionsInfoString.canGrantView.enter)}`
    ] };
  }
  if (receiverPermissions.canView === 'content' && !giverCanAtLeastGrantView('content')) {
    return { canView: [
      `You need ${bolden(permissionsInfoString.canGrantView.string)} to be at least ${
        bolden(permissionsInfoString.canGrantView.content)}`
    ] };
  }
  if (receiverPermissions.canView === 'content_with_descendants' && !giverCanAtLeastGrantView('content_with_descendants')) {
    return { canView: [
      `You need ${bolden(permissionsInfoString.canGrantView.string)} to be at least ${
        bolden(permissionsInfoString.canGrantView.content_with_descendants)}`
    ] };
  }
  if (receiverPermissions.canView === 'solution' && !giverCanAtLeastGrantView('solution')) {
    return { canView: [
      `You need ${bolden(permissionsInfoString.canGrantView.string)} to be at least ${
        bolden(permissionsInfoString.canGrantView.solution)}`
    ] };
  }
  return {};
}

export function validateCanGrantView(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canGrantView'>,
  giverPermissions: Pick<PermissionsInfo, 'canGrantView' | 'isOwner'>
): { canGrantView?: string[] } {

  if (receiverPermissions.canGrantView === 'none') return {};

  const errors: string[] = [];
  const receiverCanAtLeastView = hasAtLeastPermission(canViewValues, receiverPermissions.canView);

  if (receiverPermissions.canGrantView === 'solution_with_grant') {
    if (!giverPermissions.isOwner) {
      errors.push($localize`You need to be owner of this item`);
    }
    if (!receiverCanAtLeastView('solution')) {
      errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
        bolden(permissionsInfoString.canView.solution)}`);
    }
  } else {

    if (giverPermissions.canGrantView !== 'solution_with_grant') {
      errors.push(`You need ${bolden(permissionsInfoString.canGrantView.string)} to be ${
        bolden(permissionsInfoString.canGrantView.solution_with_grant)}`);
    }

    if (receiverPermissions.canGrantView === 'enter' && !receiverCanAtLeastView('info')) {
      errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
        bolden(permissionsInfoString.canView.info)}`);
    }

    if (receiverPermissions.canGrantView === 'content' && !receiverCanAtLeastView('content')) {
      errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
        bolden(permissionsInfoString.canView.content)}`);
    }
    if (receiverPermissions.canGrantView === 'content_with_descendants' && !receiverCanAtLeastView('content_with_descendants')) {
      errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
        bolden(permissionsInfoString.canView.content_with_descendants)}`);
    }
    if (receiverPermissions.canGrantView === 'solution' && !receiverCanAtLeastView('solution')) {
      errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be ${
        bolden(permissionsInfoString.canView.solution)}`);
    }
  }

  return errors.length === 0 ? {} : { canGrantView: errors };
}

export function validateCanWatch(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canWatch'>,
  giverPermissions: Pick<PermissionsInfo, 'canWatch' | 'isOwner'>
): { canWatch?: string[] } {

  if (receiverPermissions.canWatch === 'none') return {};

  const errors: string[] = [];

  // For all canWatch except 'none'
  if (!hasAtLeastPermission(canViewValues, receiverPermissions.canView)('content')) {
    errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
      bolden(permissionsInfoString.canView.content)}`);
  }

  if (receiverPermissions.canWatch === 'answer_with_grant') {
    if (!giverPermissions.isOwner) {
      errors.push($localize`You need to be owner of this item`);
    }
  } else {

    // if receiverPermissions.canWatch is 'result' or 'answer'
    if (giverPermissions.canWatch !== 'answer_with_grant') {
      errors.push(`You need ${bolden(permissionsInfoString.canWatch.string)} to be ${
        bolden(permissionsInfoString.canWatch.answer_with_grant)}`);
    }
  }

  return errors.length === 0 ? {} : { canWatch: errors };
}

export function validateCanEdit(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canEdit'>,
  giverPermissions: Pick<PermissionsInfo, 'canEdit' | 'isOwner'>
): { canEdit?: string[] } {

  if (receiverPermissions.canEdit === 'none') return {};

  const errors: string[] = [];

  // For all can_edit except 'none'
  if (!hasAtLeastPermission(canViewValues, receiverPermissions.canView)('content')) {
    errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
      bolden(permissionsInfoString.canView.content)}`);
  }

  if (receiverPermissions.canEdit === 'all_with_grant') {
    if (!giverPermissions.isOwner) {
      errors.push($localize`You need to be owner of this item`);
    }
  } else {

    // if receiverPermissions.canEdit is 'children' or 'all_with_grant'
    if (!(giverPermissions.canEdit === 'all_with_grant')) {
      errors.push(`You need ${bolden(permissionsInfoString.canEdit.string)} to be ${
        bolden(permissionsInfoString.canEdit.all_with_grant)}`);
    }
  }

  return errors.length === 0 ? {} : { canEdit: errors };
}

export function validateCanMakeSessionOfficial(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canMakeSessionOfficial'>,
  giverPermissions: Pick<PermissionsInfo, 'isOwner'>
): { canMakeSessionOfficial?: string[] } {

  if (!receiverPermissions.canMakeSessionOfficial) return {};

  const errors: string[] = [];

  if (!giverPermissions.isOwner) {
    errors.push($localize`You need to be owner of this item`);
  }
  if (!hasAtLeastPermission(canViewValues, receiverPermissions.canView)('info')) {
    errors.push(`This user needs ${bolden(permissionsInfoString.canView.string)} to be at least ${
      bolden(permissionsInfoString.canView.info)}`);
  }

  return errors.length === 0 ? {} : { canMakeSessionOfficial: errors };
}

export function validateIsOwner(
  receiverPermissions: Pick<GroupPermissions, 'isOwner'>,
  giverPermissions: Pick<PermissionsInfo, 'isOwner'>
): { isOwner?: string[] } {

  if (!receiverPermissions.isOwner) return {};

  if (!giverPermissions.isOwner) {
    return { isOwner: [ $localize`You need to be owner of this item` ] };
  }
  return {};
}

export function permissionsConstraintsValidator(
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

    let errors: ValidationErrors = {
      ...validateCanView(value, giverPermissions),
      ...validateCanGrantView(value, giverPermissions),
      ...validateCanWatch(value, giverPermissions),
      ...validateCanEdit(value, giverPermissions),
    };

    if (group.get('isOwner')?.dirty) {
      errors = { ...errors, ...validateIsOwner(value, giverPermissions) };
    }
    if (group.get('canMakeSessionOfficial')?.dirty) {
      errors = { ...errors, ...validateCanMakeSessionOfficial(value, giverPermissions) };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function generateValues(
  targetType: TypeFilter,
  receiverPermissions: GroupPermissions,
  giverPermissions: PermissionsInfo
): PermissionsDialogData {

  return {
    canViewValues: generateCanViewValues(targetType).map(val => {
      const errors = validateCanView({ ...receiverPermissions, canView: val.value }, giverPermissions);
      return errors.canView ? { ...val, disabled: true, tooltip: errors.canView } : val;
    }),

    canGrantViewValues: generateCanGrantViewValues(targetType).map(val => {
      const errors = validateCanGrantView({ ...receiverPermissions, canGrantView: val.value }, giverPermissions);
      return errors.canGrantView ? { ...val, disabled: true, tooltip: errors.canGrantView } : val;
    }),

    canWatchValues: generateCanWatchValues(targetType).map(val => {
      const errors = validateCanWatch({ ...receiverPermissions, canWatch: val.value }, giverPermissions);
      return errors.canWatch ? { ...val, disabled: true, tooltip: errors.canWatch } : val;
    }),

    canEditValues: generateCanEditValues(targetType).map(val => {
      const errors = validateCanEdit({ ...receiverPermissions, canEdit: val.value }, giverPermissions);
      return errors.canEdit ? { ...val, disabled: true, tooltip: errors.canEdit } : val;
    }),

    isOwnerDisabledTooltip: validateIsOwner({ ...receiverPermissions, isOwner: true }, giverPermissions).isOwner,

    canMakeSessionOfficialDisabledTooltip: validateCanMakeSessionOfficial(
      { ...receiverPermissions, canMakeSessionOfficial: true }, giverPermissions
    ).canMakeSessionOfficial,
  };
}
