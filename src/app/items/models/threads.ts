import { z } from 'zod/v4';

export const threadStatusSchema = z.enum([ 'not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed' ]);

export type ThreadStatus = z.infer<typeof threadStatusSchema>;
