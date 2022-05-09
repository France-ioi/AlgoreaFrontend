import * as D from 'io-ts/Decoder';

export const canViewValues = [ 'none', 'info', 'content', 'content_with_descendants', 'solution' ] as const;
export const canWatchValues = [ 'none','result','answer','answer_with_grant' ] as const;
export const canEditValues = [ 'none','children','all','all_with_grant' ] as const;
export const canGrantViewValues = [ 'none','enter','content','content_with_descendants','solution','solution_with_grant' ] as const;

export const permissionsDecoder = D.struct({
  canView: D.literal(...canViewValues),
  canWatch: D.literal(...canWatchValues),
  canEdit: D.literal(...canEditValues),
  canGrantView: D.literal(...canGrantViewValues),
  isOwner: D.boolean,
});

export type PermissionsInfo = D.TypeOf<typeof permissionsDecoder>;

export interface ItemPermissionsInfo {
  permissions: PermissionsInfo,
}

export function canCurrentUserViewItemContent(item: ItemPermissionsInfo): boolean {
  return [ 'content','content_with_descendants','solution' ].includes(item.permissions.canView);
}

export function canCurrentUserViewItem (item: ItemPermissionsInfo): boolean {
  return item.permissions.canView !== 'none';
}
