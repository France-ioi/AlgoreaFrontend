import { z } from 'zod';

export const wsMessageSchema = z.object({
  label: z.string(),
  data: z.unknown(),
});

export type WsMessage = z.infer<typeof wsMessageSchema>;
