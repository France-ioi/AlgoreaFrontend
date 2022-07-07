import { pipe } from 'fp-ts/lib/function';
import * as D from 'io-ts/Decoder';
import { allowsGrantingView, itemGrantViewPermDecoder } from 'src/app/shared/models/domain/item-grant-view-permission';
import { itemViewPermDecoder } from 'src/app/shared/models/domain/item-view-permission';

export const canWatchValues = [ 'none','result','answer','answer_with_grant' ] as const;
export const canEditValues = [ 'none','children','all','all_with_grant' ] as const;

export const permissionsDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(itemGrantViewPermDecoder),
  D.intersect(
    D.struct({
      canWatch: D.literal(...canWatchValues),
      canEdit: D.literal(...canEditValues),
      isOwner: D.boolean,
    })
  )
);

export type PermissionsInfo = D.TypeOf<typeof permissionsDecoder>;

export interface ItemPermissionsInfo {
  permissions: PermissionsInfo,
}

export function canGivePermissions(p: PermissionsInfo): boolean {
  return allowsGrantingView(p) || p.canWatch === 'answer_with_grant' || p.canEdit === 'all_with_grant';
}
