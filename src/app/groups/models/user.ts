import { z } from 'zod/v4';
import { requirePersonalInfoAccessApprovalSchema } from 'src/app/groups/models/group-approvals';
import { Pipe, PipeTransform } from '@angular/core';

export const userBaseShape = {
  login: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
};
export const userBaseSchema = z.object(userBaseShape);
export const userGroupIdShape = { groupId: z.string() };
export const userIdShape = { id: z.string() };
export const userGradeShape = { grade: z.number().nullable() };

export type UserBase = z.infer<typeof userBaseSchema>;

export function formatUser<T extends UserBase>(user: T) : string {
  if (user.firstName || user.lastName) {
    let fullName = '';

    if (user.firstName) {
      fullName += user.firstName;
    }

    if (user.lastName) {
      fullName += user.firstName ? ` ${ user.lastName }` : user.lastName;
    }

    return `${ fullName } (${ user.login })`;
  }

  return user.login;
}

export const userSchema = z.object({
  ...userBaseShape,
  ...userGroupIdShape,
  tempUser: z.boolean(),
  webSite: z.string().nullable(),
  freeText: z.string().nullable(),
  isCurrentUser: z.boolean(),
  ancestorsCurrentUserIsManagerOf: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  currentUserCanWatchUser: z.boolean().optional(),
  currentUserCanGrantUserAccess: z.boolean().optional(),
  personalInfoAccessApprovalToCurrentUser: requirePersonalInfoAccessApprovalSchema.optional(),
});

export type User = z.infer<typeof userSchema>;

export function canViewPersonalInfo(user: User): boolean {
  return user.isCurrentUser
    || user.personalInfoAccessApprovalToCurrentUser === 'view'
    || user.personalInfoAccessApprovalToCurrentUser === 'edit';
}

export function canEditPersonalInfo(user: User): boolean {
  return user.isCurrentUser
    || user.personalInfoAccessApprovalToCurrentUser === 'edit';
}

@Pipe({ name: 'canViewPersonalInfo', pure: true, standalone: true })
export class CanViewPersonalInfoPipe implements PipeTransform {
  transform = canViewPersonalInfo;
}

@Pipe({ name: 'canEditPersonalInfo', pure: true, standalone: true })
export class CanEditPersonalInfoPipe implements PipeTransform {
  transform = canEditPersonalInfo;
}
