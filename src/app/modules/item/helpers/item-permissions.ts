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

export const permissionsInfoString = {
  canView: {
    string: $localize`Can view`,
    none: $localize`Nothing`,
    info: $localize`Info`,
    content: $localize`Content`,
    content_with_descendants: $localize`Content and descendants`,
    solution: $localize`Solution`,
  },
  canGrantView: {
    string: $localize`Can grant view`,
    none: $localize`Nothing`,
    enter: $localize`Info & enter`,
    content: $localize`Content`,
    content_with_descendants: $localize`Content and descendants`,
    solution: $localize`Solution`,
    solution_with_grant: $localize`Solution and grant`,
  },
  canWatch: {
    string: $localize`Can watch`,
    none: $localize`Nothing`,
    result: $localize`Result`,
    answer: $localize`Answer`,
    answer_with_grant: $localize`Answer and grant`,
  },
  canEdit: {
    string: $localize`Can edit`,
    none: $localize`Nothing`,
    children: $localize`Children`,
    all: $localize`All`,
    all_with_grant: $localize`All and grant`,
  }
};
