import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import {
  ITEMVIEWPERM_CONTENT,
  ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMVIEWPERM_INFO,
  ITEMVIEWPERM_SOLUTION,
  itemViewPermValues } from 'src/app/shared/models/domain/item-view-permission';
import { PermissionsInfo, canGrantViewValues } from './item-permissions';

/**
 * The permissions that are subject to a constraint
 */
export type ConstrainedPermissions = Omit<GroupPermissions, 'canEnterUntil' | 'canEnterFrom'>;

export interface ConstraintError<Permission extends keyof ConstrainedPermissions = keyof ConstrainedPermissions> {
  permission: Permission,
  expectedValue: ConstrainedPermissions[Permission],
  constraintType: 'atLeast' | 'equals',
  on: 'giver' | 'receiver',
}

function genError<Permission extends keyof ConstrainedPermissions>(permission: Permission) {
  return (
    expectedValue: ConstrainedPermissions[Permission],
    on: 'giver' | 'receiver',
    constraintType?: ConstrainedPermissions[Permission] extends boolean ? never : 'atLeast',
  ): ConstraintError<Permission> => ({
    permission, expectedValue, constraintType: constraintType ?? 'equals', on
  });
}

function hasAtLeastPermission<T extends readonly string[]>(permissionsSortedByLoosest: T, permission: T[number]) {
  return (minimumPermission: T[number]): boolean =>
    permissionsSortedByLoosest.indexOf(permission) >= permissionsSortedByLoosest.indexOf(minimumPermission);
}

export function validateCanView(
  receiverPermissions: Pick<GroupPermissions, 'canView'>,
  giverPermissions: Pick<PermissionsInfo, 'canGrantView'>
): ConstraintError[] {

  const giverCanAtLeastGrantView = hasAtLeastPermission(canGrantViewValues, giverPermissions.canGrantView);

  if (receiverPermissions.canView === ITEMVIEWPERM_INFO && !giverCanAtLeastGrantView('enter')) {
    return [ genError('canGrantView')('enter', 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ITEMVIEWPERM_CONTENT && !giverCanAtLeastGrantView('content')) {
    return [ genError('canGrantView')('content', 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS && !giverCanAtLeastGrantView('content_with_descendants')) {
    return [ genError('canGrantView')('content_with_descendants', 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ITEMVIEWPERM_SOLUTION && !giverCanAtLeastGrantView(ITEMVIEWPERM_SOLUTION)) {
    return [ genError('canGrantView')('solution', 'giver', 'atLeast') ];
  }
  return [];
}

export function validateCanGrantView(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canGrantView'>,
  giverPermissions: Pick<PermissionsInfo, 'canGrantView' | 'isOwner'>
): ConstraintError[] {

  if (receiverPermissions.canGrantView === 'none') return [];

  const errors: ConstraintError[] = [];
  const receiverCanAtLeastView = hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView);

  if (receiverPermissions.canGrantView === 'solution_with_grant') {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
    if (!receiverCanAtLeastView(ITEMVIEWPERM_SOLUTION)) {
      errors.push(genError('canView')(ITEMVIEWPERM_SOLUTION, 'receiver', 'atLeast'));
    }
  } else {

    if (giverPermissions.canGrantView !== 'solution_with_grant') {
      errors.push(genError('canGrantView')('solution_with_grant', 'giver'));
    }

    if (receiverPermissions.canGrantView === 'enter' && !receiverCanAtLeastView(ITEMVIEWPERM_INFO)) {
      errors.push(genError('canView')(ITEMVIEWPERM_INFO, 'receiver', 'atLeast'));
    }

    if (receiverPermissions.canGrantView === 'content' && !receiverCanAtLeastView(ITEMVIEWPERM_CONTENT)) {
      errors.push(genError('canView')(ITEMVIEWPERM_CONTENT, 'receiver', 'atLeast'));
    }
    if (receiverPermissions.canGrantView === 'content_with_descendants' && !receiverCanAtLeastView(ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS)) {
      errors.push(genError('canView')(ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS, 'receiver', 'atLeast'));
    }
    if (receiverPermissions.canGrantView === 'solution' && !receiverCanAtLeastView(ITEMVIEWPERM_SOLUTION)) {
      errors.push(genError('canView')(ITEMVIEWPERM_SOLUTION, 'receiver', 'atLeast'));
    }
  }

  return errors;
}

export function validateCanWatch(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canWatch'>,
  giverPermissions: Pick<PermissionsInfo, 'canWatch' | 'isOwner'>
): ConstraintError[] {

  if (receiverPermissions.canWatch === 'none') return [];

  const errors: ConstraintError[] = [];

  // For all canWatch except 'none'
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)(ITEMVIEWPERM_CONTENT)) {
    errors.push(genError('canView')(ITEMVIEWPERM_CONTENT, 'receiver', 'atLeast'));
  }

  if (receiverPermissions.canWatch === 'answer_with_grant') {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
  } else {

    // if receiverPermissions.canWatch is 'result' or 'answer'
    if (giverPermissions.canWatch !== 'answer_with_grant') {
      errors.push(genError('canWatch')('answer_with_grant', 'giver'));
    }
  }

  return errors;
}

export function validateCanEdit(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canEdit'>,
  giverPermissions: Pick<PermissionsInfo, 'canEdit' | 'isOwner'>
): ConstraintError[] {

  if (receiverPermissions.canEdit === 'none') return [];

  const errors: ConstraintError[] = [];

  // For all can_edit except 'none'
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)('content')) {
    errors.push(genError('canView')(ITEMVIEWPERM_CONTENT, 'receiver', 'atLeast'));
  }

  if (receiverPermissions.canEdit === 'all_with_grant') {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
  } else {

    // if receiverPermissions.canEdit is 'children' or 'all_with_grant'
    if (giverPermissions.canEdit !== 'all_with_grant') {
      errors.push(genError('canEdit')('all_with_grant', 'giver'));
    }
  }

  return errors;
}

export function validateCanMakeSessionOfficial(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canMakeSessionOfficial'>,
  giverPermissions: Pick<PermissionsInfo, 'isOwner'>
): ConstraintError[] {

  if (!receiverPermissions.canMakeSessionOfficial) return [];

  const errors: ConstraintError[] = [];

  if (!giverPermissions.isOwner) {
    errors.push(genError('isOwner')(true, 'giver'));
  }
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)(ITEMVIEWPERM_INFO)) {
    errors.push(genError('canView')(ITEMVIEWPERM_INFO, 'receiver', 'atLeast'));
  }

  return errors;
}

export function validateIsOwner(
  receiverPermissions: Pick<GroupPermissions, 'isOwner'>,
  giverPermissions: Pick<PermissionsInfo, 'isOwner'>
): ConstraintError[] {

  if (!receiverPermissions.isOwner) return [];

  if (!giverPermissions.isOwner) {
    return [ genError('isOwner')(true, 'giver') ];
  }
  return [];
}

