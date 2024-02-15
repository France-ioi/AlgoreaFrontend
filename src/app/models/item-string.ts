import { z } from 'zod';

export const itemStringSchema = z.object({
  title: z.string().nullable(),
  languageTag: z.string(),
  imageUrl: z.string().nullable(),
  subtitle: z.string().nullable().optional(),
});

/* eslint-disable @typescript-eslint/explicit-function-return-type */ // Let type inference guess the return type (would be very verbose)
export const withDescription = <T extends typeof itemStringSchema>(s: T) => s.extend({ description: z.string().nullable().optional() });
/* eslint-enable @typescript-eslint/explicit-function-return-type */
