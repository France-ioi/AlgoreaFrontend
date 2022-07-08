import { pipe } from 'fp-ts/lib/function';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from '../../helpers/decoders';
import { allowsGrantingEdition, ItemEditPerm, itemEditPermDecoder } from './item-edit-permission';
import { allowsGrantingView, ItemGrantViewPerm, itemGrantViewPermDecoder } from './item-grant-view-permission';
import { itemViewPermDecoder } from './item-view-permission';
import { allowsGrantingWatch, ItemWatchPerm, itemWatchPermDecoder } from './item-watch-permission';

export const itemOwnerPermDecoder = D.struct({
  isOwner: D.boolean
});
export type ItemOwnerPerm = D.TypeOf<typeof itemOwnerPermDecoder>;

export const itemSessionPermDecoder = D.struct({
  canMakeSessionOfficial: D.boolean
});
export type ItemSessionPerm = D.TypeOf<typeof itemSessionPermDecoder>;

export const itemEntryTimePermDecoder = D.struct({
  canEnterFrom: dateDecoder,
  canEnterUntil: dateDecoder,
});
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
export function allowsGivingPermToItem(p: ItemGrantViewPerm & ItemWatchPerm & ItemEditPerm): boolean {
  return allowsGrantingView(p) || allowsGrantingWatch(p) || allowsGrantingEdition(p);
}
