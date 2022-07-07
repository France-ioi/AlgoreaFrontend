import { pipe } from 'fp-ts/lib/function';
import * as D from 'io-ts/Decoder';
import { itemViewPermDecoder } from 'src/app/shared/models/domain/item-view-permission';

export const canWatchValues = [ 'none','result','answer','answer_with_grant' ] as const;
export const canEditValues = [ 'none','children','all','all_with_grant' ] as const;
export const canGrantViewValues = [ 'none','enter','content','content_with_descendants','solution','solution_with_grant' ] as const;

export const permissionsDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(
    D.struct({
      canWatch: D.literal(...canWatchValues),
      canEdit: D.literal(...canEditValues),
      canGrantView: D.literal(...canGrantViewValues),
      isOwner: D.boolean,
    })
  )
);

export type PermissionsInfo = D.TypeOf<typeof permissionsDecoder>;

export interface ItemPermissionsInfo {
  permissions: PermissionsInfo,
}

export function canGivePermissions(item: ItemPermissionsInfo): boolean {
  return item.permissions.canGrantView !== 'none' ||
    item.permissions.canWatch === 'answer_with_grant' ||
    item.permissions.canEdit === 'all_with_grant';
}
