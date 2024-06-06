import * as D from 'io-ts/Decoder';
import { dateDecoder } from 'src/app/utils/decoders';

export const groupApprovalsDecoder = D.struct({
  requireLockMembershipApprovalUntil: D.nullable(dateDecoder),
  requirePersonalInfoAccessApproval: D.literal('none', 'view', 'edit'),
  requireWatchApproval: D.boolean,
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
