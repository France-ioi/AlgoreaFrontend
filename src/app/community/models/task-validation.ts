import { z } from 'zod';

export const rawTaskValidationSchema = z.object({
  time: z.number(),
  participantId: z.string(),
  itemId: z.string(),
  answerId: z.string(),
});

export type RawTaskValidation = z.infer<typeof rawTaskValidationSchema>;

export const taskValidationsResponseSchema = z.object({
  validations: z.array(rawTaskValidationSchema),
});
