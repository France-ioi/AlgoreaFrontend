import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { ItemEditPerm, ItemPermWithEdit } from 'src/app/shared/models/domain/item-edit-permission';
import { ItemPermWithGrantView, itemGrantViewPermValues, ItemGrantViewPerm } from 'src/app/shared/models/domain/item-grant-view-permission';
import { ItemOwnerPerm, ItemSessionPerm } from 'src/app/shared/models/domain/item-permissions';
import { ItemViewPerm, itemViewPermValues, ItemPermWithView } from 'src/app/shared/models/domain/item-view-permission';
import { ItemPermWithWatch, ItemWatchPerm } from 'src/app/shared/models/domain/item-watch-permission';

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

export function hasAtLeastPermission<T extends readonly string[]>(permissionsSortedByLoosest: T, permission: T[number]) {
  return (minimumPermission: T[number]): boolean =>
    permissionsSortedByLoosest.indexOf(permission) >= permissionsSortedByLoosest.indexOf(minimumPermission);
}

export function validateCanView(receiverPermissions: ItemPermWithView, giverPermissions: ItemPermWithGrantView): ConstraintError[] {

  const giverCanAtLeastGrantView = hasAtLeastPermission(itemGrantViewPermValues, giverPermissions.canGrantView);

  if (receiverPermissions.canView === ItemViewPerm.Info && !giverCanAtLeastGrantView(ItemGrantViewPerm.Enter)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.Enter, 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ItemViewPerm.Content && !giverCanAtLeastGrantView(ItemGrantViewPerm.Content)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.Content, 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ItemViewPerm.ContentWithDescendants &&
    !giverCanAtLeastGrantView(ItemGrantViewPerm.ContentWithDescendants)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.ContentWithDescendants, 'giver', 'atLeast') ];
  }
  if (receiverPermissions.canView === ItemViewPerm.Solution && !giverCanAtLeastGrantView(ItemGrantViewPerm.Solution)) {
    return [ genError('canGrantView')(ItemGrantViewPerm.Solution, 'giver', 'atLeast') ];
  }
  return [];
}

export function validateCanGrantView(
  receiverPermissions: ItemPermWithView & ItemPermWithGrantView,
  giverPermissions: ItemPermWithGrantView & ItemOwnerPerm
): ConstraintError[] {

  if (receiverPermissions.canGrantView === ItemGrantViewPerm.None) return [];

  const errors: ConstraintError[] = [];
  const receiverCanAtLeastView = hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView);

  if (receiverPermissions.canGrantView === ItemGrantViewPerm.SolutionWithGrant) {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
    if (!receiverCanAtLeastView(ItemViewPerm.Solution)) {
      errors.push(genError('canView')(ItemViewPerm.Solution, 'receiver', 'atLeast'));
    }
  } else {

    if (giverPermissions.canGrantView !== ItemGrantViewPerm.SolutionWithGrant) {
      errors.push(genError('canGrantView')(ItemGrantViewPerm.SolutionWithGrant, 'giver'));
    }

    if (receiverPermissions.canGrantView === ItemGrantViewPerm.Enter && !receiverCanAtLeastView(ItemViewPerm.Info)) {
      errors.push(genError('canView')(ItemViewPerm.Info, 'receiver', 'atLeast'));
    }

    if (receiverPermissions.canGrantView === ItemGrantViewPerm.Content && !receiverCanAtLeastView(ItemViewPerm.Content)) {
      errors.push(genError('canView')(ItemViewPerm.Content, 'receiver', 'atLeast'));
    }
    if (receiverPermissions.canGrantView === ItemGrantViewPerm.ContentWithDescendants &&
      !receiverCanAtLeastView(ItemViewPerm.ContentWithDescendants)) {
      errors.push(genError('canView')(ItemViewPerm.ContentWithDescendants, 'receiver', 'atLeast'));
    }
    if (receiverPermissions.canGrantView === ItemGrantViewPerm.Solution && !receiverCanAtLeastView(ItemViewPerm.Solution)) {
      errors.push(genError('canView')(ItemViewPerm.Solution, 'receiver', 'atLeast'));
    }
  }

  return errors;
}

export function validateCanWatch(
  receiverPermissions: ItemPermWithView & ItemPermWithWatch,
  giverPermissions: ItemPermWithWatch & ItemOwnerPerm
): ConstraintError[] {

  if (receiverPermissions.canWatch === ItemWatchPerm.None) return [];

  const errors: ConstraintError[] = [];

  // For all canWatch except 'none'
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)(ItemViewPerm.Content)) {
    errors.push(genError('canView')(ItemViewPerm.Content, 'receiver', 'atLeast'));
  }

  if (receiverPermissions.canWatch === ItemWatchPerm.AnswerWithGrant) {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
  } else {

    // if receiverPermissions.canWatch is 'result' or 'answer'
    if (giverPermissions.canWatch !== ItemWatchPerm.AnswerWithGrant) {
      errors.push(genError('canWatch')(ItemWatchPerm.AnswerWithGrant, 'giver'));
    }
  }

  return errors;
}

export function validateCanEdit(
  receiverPermissions: ItemPermWithView & ItemPermWithEdit,
  giverPermissions: ItemPermWithEdit & ItemOwnerPerm
): ConstraintError[] {

  if (receiverPermissions.canEdit === ItemEditPerm.None) return [];

  const errors: ConstraintError[] = [];

  // For all can_edit except 'none'
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)(ItemViewPerm.Content)) {
    errors.push(genError('canView')(ItemViewPerm.Content, 'receiver', 'atLeast'));
  }

  if (receiverPermissions.canEdit === ItemEditPerm.AllWithGrant) {
    if (!giverPermissions.isOwner) {
      errors.push(genError('isOwner')(true, 'giver'));
    }
  } else {

    // if receiverPermissions.canEdit is 'children' or 'all_with_grant'
    if (giverPermissions.canEdit !== ItemEditPerm.AllWithGrant) {
      errors.push(genError('canEdit')(ItemEditPerm.AllWithGrant, 'giver'));
    }
  }

  return errors;
}

export function validateCanMakeSessionOfficial(
  receiverPermissions: ItemPermWithView & ItemSessionPerm,
  giverPermissions: ItemOwnerPerm
): ConstraintError[] {

  if (!receiverPermissions.canMakeSessionOfficial) return [];

  const errors: ConstraintError[] = [];

  if (!giverPermissions.isOwner) {
    errors.push(genError('isOwner')(true, 'giver'));
  }
  if (!hasAtLeastPermission(itemViewPermValues, receiverPermissions.canView)(ItemViewPerm.Info)) {
    errors.push(genError('canView')(ItemViewPerm.Info, 'receiver', 'atLeast'));
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

