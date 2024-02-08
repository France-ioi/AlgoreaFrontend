import { z } from 'zod';

export type GroupTypeCategory = 'group'|'user';

export function isGroupTypeVisible(type: string): boolean {
  return type !== 'Base' && type !== 'ContestParticipants';
}

export const participantTypeSchema = z.enum([ 'Team', 'User' ]);
