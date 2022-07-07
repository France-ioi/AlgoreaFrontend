import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { ITEMEDITPERM_ALL_WITH_GRANT, ITEMEDITPERM_NONE } from 'src/app/shared/models/domain/item-edit-permission';
import {
  itemGrantViewPermValues,
  ITEMGRANTVIEWPERM_CONTENT,
  ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMGRANTVIEWPERM_ENTER,
  ITEMGRANTVIEWPERM_NONE,
  ITEMGRANTVIEWPERM_SOLUTION,
  ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT
} from 'src/app/shared/models/domain/item-grant-view-permission';
import {
  ITEMVIEWPERM_CONTENT,
  ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMVIEWPERM_INFO,
  ITEMVIEWPERM_SOLUTION,
  itemViewPermValues } from 'src/app/shared/models/domain/item-view-permission';
import { PermissionsInfo } from './item-permissions';

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

  const giverCanAtLeastGrantView = hasAtLeastPermission(itemGrantViewPermValues, giverPermissions.canGrantView);

  if (receiverPermissions.canView === ITEMVIEWPERM_INFO && !giverCanAtLeastGrantView(ITEMGRANTVIEWPERM_ENTER)) {
    return [ genError('canGrantView')(ITEMGRANTVIEWPERM_ENTER, 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ITEMVIEWPERM_CONTENT && !giverCanAtLeastGrantView(ITEMGRANTVIEWPERM_CONTENT)) {
    return [ genError('canGrantView')(ITEMGRANTVIEWPERM_CONTENT, 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS &&
    !giverCanAtLeastGrantView(ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS)) {
    return [ genError('canGrantView')(ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS, 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ITEMVIEWPERM_SOLUTION && !giverCanAtLeastGrantView(ITEMGRANTVIEWPERM_SOLUTION)) {
    return [ genError('canGrantView')(ITEMGRANTVIEWPERM_SOLUTION, 'giver', 'atLeast') ];
  }
  return [];
}

export function validateCanGrantView(
  receiverPermissions: Pick<GroupPermissions, 'canView' | 'canGrantView'>,
  giverPermissions: Pick<PermissionsInfo, 'canGrantView' | 'isOwner'>
): ConstraintError[] {

  if (receiverPermissions.canGrantView === ITEMGRANTVIEWPERM_NONE) return [];

  const errors: ConstraintError[] = [];
  const receiverCanAtLeastView = hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView);

  if (receiverPermissions.canGrantView === ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT) {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
    if (!receiverCanAtLeastView(ITEMVIEWPERM_SOLUTION)) {
      errors.push(genError('canView')(ITEMVIEWPERM_SOLUTION, 'receiver', 'atLeast'));
    }
  } else {

    if (giverPermissions.canGrantView !== ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT) {
      errors.push(genError('canGrantView')(ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT, 'giver'));
    }

    if (receiverPermissions.canGrantView === ITEMGRANTVIEWPERM_ENTER && !receiverCanAtLeastView(ITEMVIEWPERM_INFO)) {
      errors.push(genError('canView')(ITEMVIEWPERM_INFO, 'receiver', 'atLeast'));
    }

    if (receiverPermissions.canGrantView === ITEMGRANTVIEWPERM_CONTENT && !receiverCanAtLeastView(ITEMVIEWPERM_CONTENT)) {
      errors.push(genError('canView')(ITEMVIEWPERM_CONTENT, 'receiver', 'atLeast'));
    }
    if (receiverPermissions.canGrantView === ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS &&
      !receiverCanAtLeastView(ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS)) {
      errors.push(genError('canView')(ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS, 'receiver', 'atLeast'));
    }
    if (receiverPermissions.canGrantView === ITEMGRANTVIEWPERM_SOLUTION && !receiverCanAtLeastView(ITEMVIEWPERM_SOLUTION)) {
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

  if (receiverPermissions.canEdit === ITEMEDITPERM_NONE) return [];

  const errors: ConstraintError[] = [];

  // For all can_edit except 'none'
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)('content')) {
    errors.push(genError('canView')(ITEMVIEWPERM_CONTENT, 'receiver', 'atLeast'));
  }

  if (receiverPermissions.canEdit === ITEMEDITPERM_ALL_WITH_GRANT) {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
  } else {

    // if receiverPermissions.canEdit is 'children' or 'all_with_grant'
    if (giverPermissions.canEdit !== ITEMEDITPERM_ALL_WITH_GRANT) {
      errors.push(genError('canEdit')(ITEMEDITPERM_ALL_WITH_GRANT, 'giver'));
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

