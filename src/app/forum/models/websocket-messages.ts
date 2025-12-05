import { z } from 'zod';

export const wsMessageSchema = z.looseObject({
  action: z.string(),
});

export type WsMessage = z.infer<typeof wsMessageSchema>;
