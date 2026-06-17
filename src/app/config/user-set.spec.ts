import { isUserInSet } from './user-set';
import { CurrentUserProfile } from '../data-access/current-user.service';

const profile = (overrides: Partial<CurrentUserProfile> = {}): CurrentUserProfile => ({
  groupId: 'group-1',
  login: 'user',
  profile: {},
  defaultLanguage: 'en',
  tempUser: false,
  ...overrides,
});

describe('isUserInSet', () => {
  it('returns true for all', () => {
    expect(isUserInSet(profile(), 'all')).toBeTrue();
    expect(isUserInSet(profile({ tempUser: true }), 'all')).toBeTrue();
  });

  it('returns true for tempUsers only when user is temporary', () => {
    expect(isUserInSet(profile({ tempUser: true }), 'tempUsers')).toBeTrue();
    expect(isUserInSet(profile({ tempUser: false }), 'tempUsers')).toBeFalse();
  });

  it('returns true for nonTempUsers only when user is not temporary', () => {
    expect(isUserInSet(profile({ tempUser: false }), 'nonTempUsers')).toBeTrue();
    expect(isUserInSet(profile({ tempUser: true }), 'nonTempUsers')).toBeFalse();
  });

  it('returns true when groupId is in the configured list', () => {
    expect(isUserInSet(profile({ groupId: 'group-1' }), [ 'group-1', 'group-2' ])).toBeTrue();
    expect(isUserInSet(profile({ groupId: 'group-3' }), [ 'group-1', 'group-2' ])).toBeFalse();
  });
});
