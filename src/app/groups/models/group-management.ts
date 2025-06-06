import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export const groupManagershipLevelSchema = z.enum([ 'none', 'memberships', 'memberships_and_group' ]);
export type GroupManagershipLevel = z.infer<typeof groupManagershipLevelSchema>;
export const groupManagershipLevelEnum = groupManagershipLevelSchema.enum;
const l = groupManagershipLevelEnum; // local shorthand

const groupManagershipTypeSchema = z.enum([ 'none', 'direct', 'ancestor', 'descendant' ]);
export type GroupManagershipType = z.infer<typeof groupManagershipTypeSchema>;
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

export function isCurrentUserManager<T extends CurrentUserManagershipInfo>(g: T): boolean {
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

export function canCurrentUserManageMembersAndGroup<T extends CurrentUserManagershipInfo>(g: T): boolean {
  return g.currentUserCanManage === l.memberships_and_group;
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({ name: 'isCurrentUserManager', pure: true, standalone: true })
export class IsCurrentUserManagerPipe implements PipeTransform {
  transform = isCurrentUserManager;
}

@Pipe({ name: 'canCurrentUserGrantGroupAccess', pure: true, standalone: true })
export class CanCurrentUserGrantGroupAccessPipe implements PipeTransform {
  transform = canCurrentUserGrantGroupAccess;
}

@Pipe({ name: 'canCurrentUserWatchMembers', pure: true, standalone: true })
export class CanCurrentUserWatchMembersPipe implements PipeTransform {
  transform = canCurrentUserWatchMembers;
}

@Pipe({ name: 'canCurrentUserManageMembers', pure: true, standalone: true })
export class CanCurrentUserManageMembersPipe implements PipeTransform {
  transform = canCurrentUserManageMembers;
}

@Pipe({ name: 'canCurrentUserManageMembersAndGroup', pure: true, standalone: true })
export class CanCurrentUserManageMembersAndGroupPipe implements PipeTransform {
  transform = canCurrentUserManageMembersAndGroup;
}
