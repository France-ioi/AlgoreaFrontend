import { pipe } from 'fp-ts/lib/function';
import * as D from 'io-ts/Decoder';
import { allowsGrantingEdition, itemEditPermDecoder } from 'src/app/shared/models/domain/item-edit-permission';
import { allowsGrantingView, itemGrantViewPermDecoder } from 'src/app/shared/models/domain/item-grant-view-permission';
import { itemViewPermDecoder } from 'src/app/shared/models/domain/item-view-permission';
import { allowsGrantingWatch, itemWatchPermDecoder } from 'src/app/shared/models/domain/item-watch-permission';

export const permissionsDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(itemGrantViewPermDecoder),
  D.intersect(itemEditPermDecoder),
  D.intersect(itemWatchPermDecoder),
  D.intersect(
    D.struct({
      isOwner: D.boolean,
    })
  )
);

export type PermissionsInfo = D.TypeOf<typeof permissionsDecoder>;

export interface ItemPermissionsInfo {
  permissions: PermissionsInfo,
}

export function canGivePermissions(p: PermissionsInfo): boolean {
  return allowsGrantingView(p) || allowsGrantingWatch(p) || allowsGrantingEdition(p);
}
