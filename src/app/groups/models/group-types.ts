import { z } from 'zod/v4';

// domain level group typing
const groupTypeSchema = z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base', 'ContestParticipants', 'User' ]);
export const groupTypeEnum = groupTypeSchema.enum;
const t = groupTypeEnum; // local shorthand

export const nonUserGroupTypeSchema = groupTypeSchema.exclude([ t.User ]);
export const participantTypeSchema = groupTypeSchema.extract([ t.Team, t.User ]);

// category
export const groupGroupTypeCategory = 'group';
export const userGroupTypeCategory = 'user';

export type GroupTypeCategory = typeof groupGroupTypeCategory | typeof userGroupTypeCategory;

// helpers
export function isGroupTypeVisible(type: string): boolean {
  return type !== 'Base' && type !== 'ContestParticipants';
}

