import { Pipe, PipeTransform } from '@angular/core';
import { z } from 'zod';

export const groupMembershipSchema = z.enum([ 'none', 'direct', 'descendant' ]);
type GroupMembership = z.infer<typeof groupMembershipSchema>;
export const groupMembershipEnum = groupMembershipSchema.enum;

export function isCurrentUserMember<T extends { currentUserMembership: GroupMembership }>(g: T): boolean {
  return g.currentUserMembership === groupMembershipEnum.direct || g.currentUserMembership == groupMembershipEnum.descendant;
}

// ********************************************
// Pipes for templates
// ********************************************

@Pipe({ name: 'isCurrentUserMember', pure: true, standalone: true })
export class IsCurrentUserMemberPipe implements PipeTransform {
  transform = isCurrentUserMember;
}
