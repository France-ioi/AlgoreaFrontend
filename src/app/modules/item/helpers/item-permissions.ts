import * as D from 'io-ts/Decoder';

export const permissionsDecoder = D.struct({
  canView: D.literal('none','info','content','content_with_descendants','solution'),
  canWatch: D.literal('none','result','answer','answer_with_grant'),
  canEdit: D.literal('none','children','all','all_with_grant'),
  canGrantView: D.literal('none','enter','content','content_with_descendants','solution','solution_with_grant'),
  isOwner: D.boolean,
});

export type PermissionsInfo = D.TypeOf<typeof permissionsDecoder>;

export interface ItemPermissionsInfo {
  permissions: PermissionsInfo
}

export function canCurrentUserViewItemContent(item: ItemPermissionsInfo): boolean {
  return [ 'content','content_with_descendants','solution' ].includes(item.permissions.canView);
}

export function canCurrentUserViewItem (item: ItemPermissionsInfo): boolean {
  return item.permissions.canView !== 'none';
}
