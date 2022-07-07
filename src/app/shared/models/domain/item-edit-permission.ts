import { Pipe, PipeTransform } from '@angular/core';
import * as D from 'io-ts/Decoder';

// short versions, not for export
const
  NONE = 'none',
  CHILDREN = 'children',
  ALL = 'all',
  ALL_WITH_GRANT = 'all_with_grant';

export const
  ITEMEDITPERM_NONE = NONE,
  ITEMEDITPERM_CHILDREN = CHILDREN,
  ITEMEDITPERM_ALL = ALL,
  ITEMEDITPERM_ALL_WITH_GRANT = ALL_WITH_GRANT,
  ITEMEDITPERM_MAX = ALL_WITH_GRANT;

export const itemEditPermValues = [ NONE, CHILDREN, ALL, ALL_WITH_GRANT ] as const;
export const itemEditPermDecoder = D.struct({
  canEdit: D.literal(...itemEditPermValues)
});
export type ItemEditPerm = D.TypeOf<typeof itemEditPermDecoder>;
export interface ItemWithEditPerm { permissions: ItemEditPerm }

/**
 * Whether the permission allows the user/group to change the children (and the properties of the relation) of the item
 */
export function allowsEditingChildren(p: ItemEditPerm): boolean {
  return [ CHILDREN, ALL, ALL_WITH_GRANT ].includes(p.canEdit);
}
/**
 * Whether the permission allows the user/group to change children and all properties of the item (but cannot delete)
 */
export function allowsEditingAll(p: ItemEditPerm): boolean {
  return [ ALL, ALL_WITH_GRANT ].includes(p.canEdit);
}
/**
 * Whether the permission allows the user/group to give editing permissions to others (require perm on the receiver as well!)
 */
export function allowsGrantingEdition(p: ItemEditPerm): boolean {
  return p.canEdit === ITEMEDITPERM_ALL_WITH_GRANT;
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({ name: 'allowsEditingChildren', pure: true })
export class AllowsEditingChildrenItemPipe implements PipeTransform {
  transform = allowsEditingChildren;
}

@Pipe({ name: 'allowsEditingAll', pure: true })
export class AllowsEditingAllItemPipe implements PipeTransform {
  transform = allowsEditingAll;
}
