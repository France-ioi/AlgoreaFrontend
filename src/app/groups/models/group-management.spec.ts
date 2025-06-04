import { canCurrentUserManageGroup, canCurrentUserManageMembers, isCurrentUserManager } from './group-management';

describe('GroupManagement', () => {

  describe('when the user is not manager (1)', () => {
    const group = { currentUserManagership: 'none' as const };

    it('should set expected values', () => {
      expect(isCurrentUserManager(group)).toBeFalsy();
      expect(canCurrentUserManageMembers(group)).toBeFalsy();
      expect(canCurrentUserManageGroup(group)).toBeFalsy();
    });
  });

  describe('when the user is not manager (2)', () => {
    const group = { currentUserManagership: 'descendant' as const };

    it('should set expected values', () => {
      expect(isCurrentUserManager(group)).toBeFalsy();
      expect(canCurrentUserManageMembers(group)).toBeFalsy();
      expect(canCurrentUserManageGroup(group)).toBeFalsy();
    });
  });


  describe('when the user manager with no perm (1)', () => {
    const group = { currentUserManagership: 'direct', currentUserCanManage: 'none' } as const;

    it('should set expected values', () => {
      expect(isCurrentUserManager(group)).toBeTruthy();
      expect(canCurrentUserManageMembers(group)).toBeFalsy();
      expect(canCurrentUserManageGroup(group)).toBeFalsy();
    });
  });

  describe('when the user manager with no perm (2)', () => {
    const group = { currentUserManagership: 'ancestor', currentUserCanManage: 'none' } as const;

    it('should set expected values', () => {
      expect(isCurrentUserManager(group)).toBeTruthy();
      expect(canCurrentUserManageMembers(group)).toBeFalsy();
      expect(canCurrentUserManageGroup(group)).toBeFalsy();
    });
  });

  describe('when the user manager with "memberships" perm', () => {
    const group = { currentUserManagership: 'direct', currentUserCanManage: 'memberships' } as const;

    it('should set expected values', () => {
      expect(isCurrentUserManager(group)).toBeTruthy();
      expect(canCurrentUserManageMembers(group)).toBeTruthy();
      expect(canCurrentUserManageGroup(group)).toBeFalsy();
    });
  });

  describe('when the user manager with max perm', () => {
    const group = { currentUserManagership: 'direct', currentUserCanManage: 'memberships_and_group' } as const;

    it('should set expected values', () => {
      expect(isCurrentUserManager(group)).toBeTruthy();
      expect(canCurrentUserManageMembers(group)).toBeTruthy();
      expect(canCurrentUserManageGroup(group)).toBeTruthy();
    });
  });

});
