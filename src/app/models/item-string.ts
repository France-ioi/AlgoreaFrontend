import { z } from 'zod';

export const itemStringSchema = z.object({
  title: z.string().nullable(),
  languageTag: z.string(),
  imageUrl: z.string().nullable(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
