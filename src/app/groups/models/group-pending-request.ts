import { z } from 'zod';
import { snakeToCamelKeys } from 'src/app/utils/case_conversion';
import { userBaseSchema, withGrade, withGroupId } from './user';

const groupPendingRequestActionSchema = z.enum([
  'invitation_created',
  'join_request_created',
  'invitation_refused',
  'join_request_refused',
]);
const a = groupPendingRequestActionSchema.enum;

const invitationActionSchema = groupPendingRequestActionSchema.extract([
  a.invitation_created,
  a.invitation_refused,
]);

const groupPendingRequestRowSchema = z.object({
  memberId: z.string(),
  at: z.coerce.date(),
  action: groupPendingRequestActionSchema,
  joiningUser: withGrade(withGroupId(userBaseSchema)),
  invitingUser: z.nullable(withGroupId(userBaseSchema)),
});

const groupPendingRequestsSchema = z.array(groupPendingRequestRowSchema);

export type GroupPendingRequest = z.infer<typeof groupPendingRequestRowSchema>;
export type InvitationAction = z.infer<typeof invitationActionSchema>;
export const invitationActions = invitationActionSchema.enum;
type PendingInvitation = Omit<GroupPendingRequest, 'action'> & { action: InvitationAction };

export function isPendingInvitation(request: GroupPendingRequest): request is PendingInvitation {
  return invitationActionSchema.safeParse(request.action).success;
}

export function parseGroupPendingRequests(raw: unknown): GroupPendingRequest[] {
  return groupPendingRequestsSchema.parse(snakeToCamelKeys(raw));
}
