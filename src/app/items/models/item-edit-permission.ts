import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export enum ItemEditPerm {
  None = 'none',
  Children = 'children',
  All = 'all',
  AllWithGrant = 'all_with_grant',
}
export const itemEditPermMax = ItemEditPerm.AllWithGrant;
const P = ItemEditPerm; // non-exported shorthand

export const itemEditPermValues = [ P.None, P.Children, P.All, P.AllWithGrant ] as const;
export const itemEditPermSchema = z.object({
  canEdit: z.enum(itemEditPermValues)
});
export type ItemPermWithEdit = z.infer<typeof itemEditPermSchema>;
export interface ItemWithEditPerm { permissions: ItemPermWithEdit }

/**
 * Whether the permission allows the user/group to change the children (and the properties of the relation) of the item
 */
export function allowsEditingChildren(p: ItemPermWithEdit): boolean {
  return [ P.Children, P.All, P.AllWithGrant ].includes(p.canEdit);
}
/**
 * Whether the permission allows the user/group to change children and all properties of the item (but cannot delete)
 */
export function allowsEditingAll(p: ItemPermWithEdit): boolean {
  return [ P.All, P.AllWithGrant ].includes(p.canEdit);
}
/**
 * Whether the permission allows the user/group to give editing permissions to others (require perm on the receiver as well!)
 */
export function allowsGrantingEdition(p: ItemPermWithEdit): boolean {
  return p.canEdit === P.AllWithGrant;
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'allowsEditingChildren', pure: true,
  standalone: true
})
export class AllowsEditingChildrenItemPipe implements PipeTransform {
  transform = allowsEditingChildren;
}

@Pipe({
  name: 'allowsEditingAll', pure: true,
  standalone: true
})
export class AllowsEditingAllItemPipe implements PipeTransform {
  transform = allowsEditingAll;
}
