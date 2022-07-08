import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { ItemEditPerm, ITEMEDITPERM_ALL_WITH_GRANT, ITEMEDITPERM_NONE } from 'src/app/shared/models/domain/item-edit-permission';
import {
  ItemGrantViewPerm,
  itemGrantViewPermValues,
  ITEMGRANTVIEWPERM_CONTENT,
  ITEMGRANTVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMGRANTVIEWPERM_ENTER,
  ITEMGRANTVIEWPERM_NONE,
  ITEMGRANTVIEWPERM_SOLUTION,
  ITEMGRANTVIEWPERM_SOLUTION_WITH_GRANT
} from 'src/app/shared/models/domain/item-grant-view-permission';
import { ItemOwnerPerm, ItemSessionPerm } from 'src/app/shared/models/domain/item-permissions';
import {
  ITEMVIEWPERM_CONTENT,
  ITEMVIEWPERM_CONTENT_WITH_DESCENDANTS,
  ITEMVIEWPERM_INFO,
  ITEMVIEWPERM_SOLUTION,
  itemViewPermValues,
  ItemViewPerm
} from 'src/app/shared/models/domain/item-view-permission';
import { ItemWatchPerm, ITEMWATCHPERM_ANSWER_WITH_GRANT, ITEMWATCHPERM_NONE } from 'src/app/shared/models/domain/item-watch-permission';

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

export function validateCanView(receiverPermissions: ItemViewPerm, giverPermissions: ItemGrantViewPerm): ConstraintError[] {

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
  receiverPermissions: ItemViewPerm & ItemGrantViewPerm,
  giverPermissions: ItemGrantViewPerm & ItemOwnerPerm
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
  receiverPermissions: ItemViewPerm & ItemWatchPerm,
  giverPermissions: ItemWatchPerm & ItemOwnerPerm
): ConstraintError[] {

  if (receiverPermissions.canWatch === ITEMWATCHPERM_NONE) return [];

  const errors: ConstraintError[] = [];

  // For all canWatch except 'none'
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)(ITEMVIEWPERM_CONTENT)) {
    errors.push(genError('canView')(ITEMVIEWPERM_CONTENT, 'receiver', 'atLeast'));
  }

  if (receiverPermissions.canWatch === ITEMWATCHPERM_ANSWER_WITH_GRANT) {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
  } else {

    // if receiverPermissions.canWatch is 'result' or 'answer'
    if (giverPermissions.canWatch !== ITEMWATCHPERM_ANSWER_WITH_GRANT) {
      errors.push(genError('canWatch')(ITEMWATCHPERM_ANSWER_WITH_GRANT, 'giver'));
    }
  }

  return errors;
}

export function validateCanEdit(
  receiverPermissions: ItemViewPerm & ItemEditPerm,
  giverPermissions: ItemEditPerm & ItemOwnerPerm
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
  receiverPermissions: ItemViewPerm & ItemSessionPerm,
  giverPermissions: ItemOwnerPerm
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

export function validateIsOwner(receiverPermissions: ItemOwnerPerm, giverPermissions: ItemOwnerPerm): ConstraintError[] {

  if (!receiverPermissions.isOwner) return [];

  if (!giverPermissions.isOwner) {
    return [ genError('isOwner')(true, 'giver') ];
  }
  return [];
}

