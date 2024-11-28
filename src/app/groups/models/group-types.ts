import { z } from 'zod';

export const groupGroupTypeCategory = 'group';
export const userGroupTypeCategory = 'user';

export type GroupTypeCategory = typeof groupGroupTypeCategory | typeof userGroupTypeCategory;

export function isGroupTypeVisible(type: string): boolean {
  return type !== 'Base' && type !== 'ContestParticipants';
}

export const participantTypeSchema = z.enum([ 'Team', 'User' ]);
