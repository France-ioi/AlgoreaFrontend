import { withManagementAdditions } from './group-management';

describe('GroupManagement', () => {

  describe('when the user is not manager (1)', () => {
    const group = { currentUserManagership: 'none' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeFalsy();
      expect(g.canCurrentUserManageMembers).toBeFalsy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user is not manager (2)', () => {
    const group = { currentUserManagership: 'descendant' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeFalsy();
      expect(g.canCurrentUserManageMembers).toBeFalsy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });


  describe('when the user manager with no perm (1)', () => {
    const group = { currentUserManagership: 'direct', currentUserCanManage: 'none' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeFalsy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user manager with no perm (2)', () => {
    const group = { currentUserManagership: 'ancestor', currentUserCanManage: 'none' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeFalsy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user manager with "memberships" perm', () => {
    const group = { currentUserManagership: 'direct', currentUserCanManage: 'memberships' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeTruthy();
      expect(g.canCurrentUserManageGroup).toBeFalsy();
    });
  });

  describe('when the user manager with max perm', () => {
    const group = { currentUserManagership: 'direct', currentUserCanManage: 'memberships_and_group' };

    it('should set expected values', () => {
      const g = withManagementAdditions(group);
      expect(g.isCurrentUserManager).toBeTruthy();
      expect(g.canCurrentUserManageMembers).toBeTruthy();
      expect(g.canCurrentUserManageGroup).toBeTruthy();
    });
  });

});
