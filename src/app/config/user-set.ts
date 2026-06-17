import { CurrentUserProfile } from '../data-access/current-user.service';
import { UserSet } from '.';

export function isUserInSet(profile: CurrentUserProfile, showTo: UserSet): boolean {
  if (showTo === 'all') return true;
  if (showTo === 'tempUsers') return profile.tempUser;
  if (showTo === 'nonTempUsers') return !profile.tempUser;
  return showTo.includes(profile.groupId);
}
