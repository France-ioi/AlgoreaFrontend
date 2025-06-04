import { z } from 'zod';

const groupManagershipLevelSchema = z.enum([ 'none', 'memberships', 'memberships_and_group' ]);
export const groupManagershipLevelEnum = groupManagershipLevelSchema.enum;
const l = groupManagershipLevelEnum; // local shorthand

const groupManagershipTypeSchema = z.enum([ 'none', 'direct', 'ancestor', 'descendant' ]);
export const groupManagershipTypeEnum = groupManagershipTypeSchema.enum;
const t = groupManagershipTypeEnum; // local shorthand

export const currentUserManagershipInfoSchema = z.object({
  currentUserManagership: groupManagershipTypeSchema,
}).and(z.object({
  currentUserCanGrantGroupAccess: z.boolean(),
  currentUserCanManage: groupManagershipLevelSchema,
  currentUserCanWatchMembers: z.boolean(),
}).partial());

type CurrentUserManagershipInfo = z.infer<typeof currentUserManagershipInfoSchema>;

function isCurrentUserManager<T extends CurrentUserManagershipInfo>(g: T): boolean {
  return g.currentUserManagership === t.direct || g.currentUserManagership == t.ancestor;
}

export function canCurrentUserGrantGroupAccess<T extends CurrentUserManagershipInfo>(g: T): boolean {
  return !!g.currentUserCanGrantGroupAccess;
}

export function canCurrentUserWatchMembers<T extends CurrentUserManagershipInfo>(g: T): boolean {
  return !!g.currentUserCanWatchMembers;
}

export function canCurrentUserManageMembers<T extends CurrentUserManagershipInfo>(g: T): boolean {
  return g.currentUserCanManage === l.memberships || g.currentUserCanManage === l.memberships_and_group;
}

export function canCurrentUserManageGroup<T extends CurrentUserManagershipInfo>(g: T): boolean {
  return g.currentUserCanManage === l.memberships_and_group;
}

export interface ManagementAdditions {
  isCurrentUserManager: boolean,
  canCurrentUserManageMembers: boolean,
  canCurrentUserManageGroup: boolean,
}

// Adds to the given group some new computed attributes (as value)
// The resulting object can be used in templates as value will not be recomputed
export function withManagementAdditions<T extends CurrentUserManagershipInfo>(g: T): T & ManagementAdditions {
  return {
    ...g,
    isCurrentUserManager: isCurrentUserManager(g),
    canCurrentUserManageMembers: canCurrentUserManageMembers(g),
    canCurrentUserManageGroup: canCurrentUserManageGroup(g),
  };
}
