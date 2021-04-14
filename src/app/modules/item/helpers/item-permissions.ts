
export interface ItemPermissionsInfo {
  permissions: {
    canView: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  }
}

export function canCurrentUserViewItemContent(item: ItemPermissionsInfo): boolean {
  return [ 'content','content_with_descendants','solution' ].includes(item.permissions.canView);
}
