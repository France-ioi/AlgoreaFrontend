import { z } from 'zod';
import { RequirePersonalInfoAccessApproval, requirePersonalInfoAccessApprovalSchema } from 'src/app/groups/models/group-approvals';
import { Pipe, PipeTransform } from '@angular/core';

export const userBaseSchema = z.object({
  login: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

/* eslint-disable @typescript-eslint/explicit-function-return-type */ // Let type inference guess the return type (would be very verbose)
export const withGroupId = <T extends z.ZodRawShape>(user: z.ZodObject<T>) => user.extend({ groupId: z.string() });
export const withId = <T extends z.ZodRawShape>(user: z.ZodObject<T>) => user.extend({ id: z.string() });
export const withGrade = <T extends z.ZodRawShape>(user: z.ZodObject<T>) => user.extend({ grade: z.number().nullable() });
/* eslint-enable @typescript-eslint/explicit-function-return-type */

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

export const userSchema = withGroupId(z.object({
  login: z.string(),
  profile: z.object({
    firstName: z.string().nullable().catch(null),
    lastName: z.string().nullable().catch(null),
    webSite: z.string().nullable().catch(null),
    freeText: z.string().nullable().catch(null),
  }).partial().optional(),
  tempUser: z.boolean(),
  isCurrentUser: z.boolean(),
  ancestorsCurrentUserIsManagerOf: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  currentUserCanWatchUser: z.boolean().optional(),
  currentUserCanGrantUserAccess: z.boolean().optional(),
  personalInfoAccessApprovalToCurrentUser: requirePersonalInfoAccessApprovalSchema.optional(),
})).transform(user => ({ firstName: user.profile?.firstName, lastName: user.profile?.lastName, ...user }));

export type User = z.infer<typeof userSchema>;

export function canViewPersonalInfo(user: User): boolean {
  return user.isCurrentUser
    || user.personalInfoAccessApprovalToCurrentUser === RequirePersonalInfoAccessApproval.View
    || user.personalInfoAccessApprovalToCurrentUser === RequirePersonalInfoAccessApproval.Edit;
}

export function canEditPersonalInfo(user: User): boolean {
  return user.isCurrentUser
    || user.personalInfoAccessApprovalToCurrentUser === RequirePersonalInfoAccessApproval.Edit;
}

@Pipe({ name: 'canViewPersonalInfo', pure: true, standalone: true })
export class CanViewPersonalInfoPipe implements PipeTransform {
  transform = canViewPersonalInfo;
}

@Pipe({ name: 'canEditPersonalInfo', pure: true, standalone: true })
export class CanEditPersonalInfoPipe implements PipeTransform {
  transform = canEditPersonalInfo;
}
