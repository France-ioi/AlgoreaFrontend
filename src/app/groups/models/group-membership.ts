import { z } from 'zod';

export const groupMembershipSchema = z.enum([ 'none', 'direct', 'descendant' ]);
export const groupMembershipEnum = groupMembershipSchema.enum;
