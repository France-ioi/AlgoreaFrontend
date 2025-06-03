import * as D from 'io-ts/Decoder';
import { z } from 'zod';

export const requirePersonalInfoAccessApprovalDecoder = D.literal('none', 'view', 'edit');
export const requirePersonalInfoAccessApprovalSchema = z.enum([ 'none', 'view', 'edit' ]);

export const groupApprovalsSchema = z.object({
  requireLockMembershipApprovalUntil: z.coerce.date().nullable(),
  requirePersonalInfoAccessApproval: requirePersonalInfoAccessApprovalSchema,
  requireWatchApproval: z.boolean(),
});

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
  ...(requirePersonalInfoAccessApproval !== 'none' ? [ ApprovalValues.PersonalInfoView ] : []),
  ...(requireLockMembershipApprovalUntil !== null ? [ ApprovalValues.LockMembership ] : []),
];
