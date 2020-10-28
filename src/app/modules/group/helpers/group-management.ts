
export interface ManagementInfo {
  current_user_is_manager: boolean;
  current_user_can_manage?: string;
}

export interface ManagementAdditions {
  isCurrentUserManager: boolean;
  canCurrentUserManageMembers: boolean;
  canCurrentUserManageGroup: boolean;
}

// Adds to the given group some new computed attributes (as value)
// The resulting object can be used in templates as value will not be recomputed
export function withManagementAdditions<T extends ManagementInfo>(group: T): T & ManagementAdditions {
  return Object.assign({}, group, {
    isCurrentUserManager: group.current_user_is_manager,
    canCurrentUserManageMembers: canCurrentUserManageMembers(group),
    canCurrentUserManageGroup: canCurrentUserManageGroup(group),
  });
}

enum ManagementLevel {
  None = 'none',
  Memberships = 'memberships',
  MembershipsAndGroup = 'memberships_and_group'
}

export function canCurrentUserManageMembers(group: ManagementInfo): boolean {
  if (group.current_user_is_manager && group.current_user_can_manage) {
    return [ ManagementLevel.Memberships as string, ManagementLevel.MembershipsAndGroup as string ].includes(group.current_user_can_manage);
  } else {
    return false;
  }
}

export function canCurrentUserManageGroup(group: ManagementInfo): boolean {
  if (group.current_user_is_manager && group.current_user_can_manage) {
    return group.current_user_can_manage === ManagementLevel.MembershipsAndGroup;
  } else {
    return false;
  }
}
