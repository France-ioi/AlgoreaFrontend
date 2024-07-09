import * as D from 'io-ts/Decoder';
import { dateDecoder, dateSchema } from 'src/app/utils/decoders';
import { z } from 'zod';

export const requirePersonalInfoAccessApprovalDecoder = D.literal('none', 'view', 'edit');
export const requirePersonalInfoAccessApprovalSchema = z.enum([ 'none', 'view', 'edit' ]);

export const groupApprovalsDecoder = D.struct({
  requireLockMembershipApprovalUntil: D.nullable(dateDecoder),
  requirePersonalInfoAccessApproval: requirePersonalInfoAccessApprovalDecoder,
  requireWatchApproval: D.boolean,
});

export const groupApprovalsSchema = z.object({
  requireLockMembershipApprovalUntil: z.nullable(dateSchema),
  requirePersonalInfoAccessApproval: requirePersonalInfoAccessApprovalSchema,
  requireWatchApproval: z.boolean(),
});

export type GroupApprovals = D.TypeOf<typeof groupApprovalsDecoder>;

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
