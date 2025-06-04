import { z } from 'zod';
import { groupCodeSchema } from './group-code';
import { groupManagershipSchema } from './group-management';
import { groupApprovalsSchema } from './group-approvals';

export const groupShortInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type GroupShortInfo = z.infer<typeof groupShortInfoSchema>;

export const groupSchema = z.object({
  id: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base' ]),
  name: z.string(),
  description: z.string().nullable(),
  isMembershipLocked: z.boolean(),
  isOpen: z.boolean(),
  isPublic: z.boolean(),
  createdAt: z.coerce.date().nullable(),
  grade: z.number(),

  currentUserMembership: z.enum([ 'none', 'direct', 'descendant' ]),
  currentUserManagership: z.enum([ 'none', 'direct', 'ancestor', 'descendant' ]),
  ancestorsCurrentUserIsManagerOf: z.array(groupShortInfoSchema),
  descendantsCurrentUserIsManagerOf: z.array(groupShortInfoSchema),
  descendantsCurrentUserIsMemberOf: z.array(groupShortInfoSchema),

  rootActivityId: z.string().nullable(),
  rootSkillId: z.string().nullable(),
  openActivityWhenJoining: z.boolean(),
}).and(groupCodeSchema).and(groupManagershipSchema).and(groupApprovalsSchema);

export type Group = z.infer<typeof groupSchema>;
