import { z } from 'zod';
import { groupCodeSchema } from './group-code';
import { currentUserManagershipInfoSchema } from './group-management';
import { groupApprovalsSchema } from './group-approvals';
import { nonUserGroupTypeSchema } from './group-types';
import { groupMembershipSchema } from './group-membership';

export const groupShortInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type GroupShortInfo = z.infer<typeof groupShortInfoSchema>;

export const groupSchema = z.object({
  id: z.string(),
  type: nonUserGroupTypeSchema,
  name: z.string(),
  description: z.string().nullable(),
  isMembershipLocked: z.boolean(),
  isOpen: z.boolean(),
  isPublic: z.boolean(),
  createdAt: z.coerce.date().nullable(),
  grade: z.number(),

  currentUserMembership: groupMembershipSchema,

  ancestorsCurrentUserIsManagerOf: z.array(groupShortInfoSchema),
  descendantsCurrentUserIsManagerOf: z.array(groupShortInfoSchema),
  descendantsCurrentUserIsMemberOf: z.array(groupShortInfoSchema),

  currentUserHasPendingInvitation: z.boolean().optional(),
  currentUserHasPendingJoinRequest: z.boolean().optional(),
  currentUserHasPendingLeaveRequest: z.boolean().optional(),

  rootActivityId: z.string().nullable(),
  rootSkillId: z.string().nullable(),
  openActivityWhenJoining: z.boolean(),
}).and(groupCodeSchema).and(currentUserManagershipInfoSchema).and(groupApprovalsSchema);

export type Group = z.infer<typeof groupSchema>;
