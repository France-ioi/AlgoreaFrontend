import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from '../../helpers/decoders';
import { allowsGrantingEdition, ItemPermWithEdit, itemEditPermDecoder } from './item-edit-permission';
import { allowsGrantingView, ItemPermWithGrantView, itemGrantViewPermDecoder } from './item-grant-view-permission';
import { itemViewPermDecoder } from './item-view-permission';
import { allowsGrantingWatch, ItemPermWithWatch, itemWatchPermDecoder } from './item-watch-permission';

export const itemOwnerPermDecoder = D.struct({
  isOwner: D.boolean
});
export type ItemOwnerPerm = D.TypeOf<typeof itemOwnerPermDecoder>;

export const itemSessionPermDecoder = D.struct({
  canMakeSessionOfficial: D.boolean
});
export type ItemSessionPerm = D.TypeOf<typeof itemSessionPermDecoder>;

export const itemEntryFromPermDecoder = D.struct({
  canEnterFrom: dateDecoder,
});
export const itemEntryUntilPermDecoder = D.struct({
  canEnterUntil: dateDecoder,
});
export const itemEntryTimePermDecoder = D.intersect(itemEntryFromPermDecoder)(itemEntryUntilPermDecoder);
export type ItemEntryTimePerm = D.TypeOf<typeof itemEntryTimePermDecoder>;

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
