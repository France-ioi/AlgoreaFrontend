import { z } from 'zod';
import { allowsGrantingEdition, ItemPermWithEdit, itemEditPermSchema } from './item-edit-permission';
import { allowsGrantingView, ItemPermWithGrantView, itemGrantViewPermSchema } from './item-grant-view-permission';
import { itemViewPermSchema } from './item-view-permission';
import { allowsGrantingWatch, ItemPermWithWatch, itemWatchPermSchema } from './item-watch-permission';

export const itemOwnerPermSchema = z.object({
  isOwner: z.boolean()
});
export type ItemOwnerPerm = z.infer<typeof itemOwnerPermSchema>;

export const itemSessionPermSchema = z.object({
  canMakeSessionOfficial: z.boolean()
});
export type ItemSessionPerm = z.infer<typeof itemSessionPermSchema>;

export const itemEntryFromPermSchema = z.object({
  canEnterFrom: z.coerce.date(),
});
export const itemEntryUntilPermSchema = z.object({
  canEnterUntil: z.coerce.date(),
});
export const itemEntryTimePermSchema = itemEntryFromPermSchema.and(itemEntryUntilPermSchema);

export type ItemEntryTimePerm = z.infer<typeof itemEntryTimePermSchema>;


export const itemCanRequestHelpSchema = z.object({
  canRequestHelp: z.boolean()
});

export const itemCorePermSchema = itemViewPermSchema
  .and(itemGrantViewPermSchema)
  .and(itemEditPermSchema)
  .and(itemWatchPermSchema)
  .and(itemOwnerPermSchema);

export type ItemCorePerm = z.infer<typeof itemCorePermSchema>;

/**
 * Whether the item permissions allows giving some permissions on the item to groups/users.
 * (warning: it requires also permissions on the receiving group/user!)
 */
export function allowsGivingPermToItem(p: ItemPermWithGrantView & ItemPermWithWatch & ItemPermWithEdit): boolean {
  return allowsGrantingView(p) || allowsGrantingWatch(p) || allowsGrantingEdition(p);
}
