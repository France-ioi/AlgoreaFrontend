import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { z } from 'zod';
import { dateDecoder } from '../../utils/decoders';
import { allowsGrantingEdition, ItemPermWithEdit, itemEditPermDecoder, itemEditPermSchema } from './item-edit-permission';
import { allowsGrantingView, ItemPermWithGrantView, itemGrantViewPermDecoder, itemGrantViewPermSchema } from './item-grant-view-permission';
import { itemViewPermDecoder, itemViewPermSchema } from './item-view-permission';
import { allowsGrantingWatch, ItemPermWithWatch, itemWatchPermDecoder, itemWatchPermSchema } from './item-watch-permission';

export const itemOwnerPermSchema = z.object({
  isOwner: z.boolean()
});

export const itemOwnerPermDecoder = D.struct({
  isOwner: D.boolean
});
export type ItemOwnerPerm = D.TypeOf<typeof itemOwnerPermDecoder>;

export const itemSessionPermSchema = z.object({
  canMakeSessionOfficial: z.boolean()
});
export const itemSessionPermDecoder = D.struct({
  canMakeSessionOfficial: D.boolean
});
export type ItemSessionPerm = D.TypeOf<typeof itemSessionPermDecoder>;

export const itemEntryFromPermSchema = z.object({
  canEnterFrom: z.coerce.date(),
});
export const itemEntryUntilPermSchema = z.object({
  canEnterUntil: z.coerce.date(),
});

export const itemEntryFromPermDecoder = D.struct({
  canEnterFrom: dateDecoder,
});
export const itemEntryUntilPermDecoder = D.struct({
  canEnterUntil: dateDecoder,
});
export const itemEntryTimePermDecoder = D.intersect(itemEntryFromPermDecoder)(itemEntryUntilPermDecoder);
export type ItemEntryTimePerm = D.TypeOf<typeof itemEntryTimePermDecoder>;


export const itemCanRequestHelpSchema = z.object({
  canRequestHelp: z.boolean()
});
export const itemCanRequestHelpDecoder = D.struct({
  canRequestHelp: D.boolean,
});

export const itemCorePermSchema = itemViewPermSchema
  .and(itemGrantViewPermSchema)
  .and(itemEditPermSchema)
  .and(itemWatchPermSchema)
  .and(itemOwnerPermSchema);

export const itemCorePermDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(itemGrantViewPermDecoder),
  D.intersect(itemEditPermDecoder),
  D.intersect(itemWatchPermDecoder),
  D.intersect(itemOwnerPermDecoder),
);
export type ItemCorePerm = D.TypeOf<typeof itemCorePermDecoder>;

/**
 * Whether the item permissions allows giving some permissions on the item to groups/users.
 * (warning: it requires also permissions on the receiving group/user!)
 */
export function allowsGivingPermToItem(p: ItemPermWithGrantView & ItemPermWithWatch & ItemPermWithEdit): boolean {
  return allowsGrantingView(p) || allowsGrantingWatch(p) || allowsGrantingEdition(p);
}
