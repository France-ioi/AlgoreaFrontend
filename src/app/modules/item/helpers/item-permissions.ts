
export interface ItemPermissionsInfo {
  permissions: {
    can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution',
  }
}

export function canCurrentUserViewItemContent(item: ItemPermissionsInfo) {
  return ['content','content_with_descendants','solution'].includes(item.permissions.can_view);
}
