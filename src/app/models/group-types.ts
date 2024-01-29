
export type GroupTypeCategory = 'group'|'user';

export function isGroupTypeVisible(type: string): boolean {
  return type !== 'Base' && type !== 'ContestParticipants';
}
