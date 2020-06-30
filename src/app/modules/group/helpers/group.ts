enum ManagementLevel {
  None = 'none',
  Memberships = 'memberships',
  MembershipsAndGroup = 'memberships_and_group'
}
export function canCurrentUserManageMembers(group: {
    current_user_is_manager: boolean,
    current_user_can_manage?: string
  }): boolean {
  if (group.current_user_can_manage) {
    return group.current_user_is_manager &&
      [ManagementLevel.Memberships as string, ManagementLevel.MembershipsAndGroup as string].includes(group.current_user_can_manage);
  } else {
    return false;
  }
}

export function canCurrentUserManageGroup(group: {
  current_user_is_manager: boolean,
  current_user_can_manage?: string
}): boolean {
if (group.current_user_can_manage) {
  return group.current_user_is_manager && group.current_user_can_manage === 'memberships_and_group';
} else {
  return false;
}
}
