import { z } from 'zod';
import { ItemType, isAnActivity } from './item-type';
import { participantTypeSchema } from 'src/app/groups/models/group-types';
import { Pipe, PipeTransform } from '@angular/core';

export function isTeamActivity(item: { type: ItemType, entryParticipantType: z.infer<typeof participantTypeSchema> }): boolean {
  if (!isAnActivity(item)) throw new Error('unexpected: isTeamActivity() called on a non-activity');
  return item.entryParticipantType === 'Team';
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'isTeamActivity', pure: true,
  standalone: true
})
export class IsTeamActivityPipe implements PipeTransform {
  transform = isTeamActivity;
}
