import { z } from 'zod';

export const wsMessageSchema = z.object({
  action: z.string(),
}).passthrough();

export type WsMessage = z.infer<typeof wsMessageSchema>;
