import { z } from 'zod';

export enum RequirePersonalInfoAccessApproval {
  None = 'none',
  View = 'view',
  Edit = 'edit',
}
const V = RequirePersonalInfoAccessApproval; // non-exported shorthand

export const requirePersonalInfoAccessApprovalSchema = z.enum([ V.None, V.View, V.Edit ]);

export const groupApprovalsSchema = z.object({
  requireLockMembershipApprovalUntil: z.coerce.date().nullable(),
  requirePersonalInfoAccessApproval: requirePersonalInfoAccessApprovalSchema,
  requireWatchApproval: z.boolean(),
});

export const infoAndWatchGroupApprovalsSchema = groupApprovalsSchema.omit({ requireLockMembershipApprovalUntil: true });

export type GroupApprovals = z.infer<typeof groupApprovalsSchema>;

export enum ApprovalValues {
  PersonalInfoView = 'personal_info_view',
  LockMembership = 'lock_membership',
  Watch = 'watch',
}

export const mapGroupApprovalParamsToValues = ({
  requirePersonalInfoAccessApproval,
  requireLockMembershipApprovalUntil,
}: GroupApprovals): string[] => [
  ...(requirePersonalInfoAccessApproval !== V.None ? [ ApprovalValues.PersonalInfoView ] : []),
  ...(requireLockMembershipApprovalUntil !== null ? [ ApprovalValues.LockMembership ] : []),
];
