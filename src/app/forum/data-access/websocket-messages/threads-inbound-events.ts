import { z } from 'zod';
import { dateSchema } from 'src/app/utils/decoders';
import { threadEventSchema } from '../../models/thread-events';

export const incomingThreadEventSchema = z.object({
  createdBy: z.string(),
  thread: z.object({
    participantId: z.string(),
    itemId: z.string(),
  }),
  time: dateSchema,
}).and(threadEventSchema);

export type IncomingThreadEvent = z.infer<typeof incomingThreadEventSchema>;
