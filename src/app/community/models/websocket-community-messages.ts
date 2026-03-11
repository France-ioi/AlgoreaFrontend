import { z } from 'zod';

export const liveActivityValidationSchema = z.object({
  action: z.literal('liveActivity.validation.new'),
  participantId: z.string(),
  itemId: z.string(),
  answerId: z.string(),
  time: z.number(),
});

export type LiveActivityValidationMessage = z.infer<typeof liveActivityValidationSchema>;
