import { withManagementAdditions } from './group-management';

describe('GroupManagement', () => {

  describe('when the user is not manager', () => {
    const group = { current_user_is_manager: false };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeFalsy();
      expect(g.canCurrentUserManageMembers).toBeFalsy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user manager with no perm', () => {
    const group = { current_user_is_manager: true, current_user_can_manage: 'none' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeFalsy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user manager with "memberships" perm', () => {
    const group = { current_user_is_manager: true, current_user_can_manage: 'memberships' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeTruthy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user manager with max perm', () => {
    const group = { current_user_is_manager: true, current_user_can_manage: 'memberships_and_group' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeTruthy();
      expect(g.canCurrentUserManageGroup).toBeTruthy();
    });
  });

});
