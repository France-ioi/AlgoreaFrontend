import { z } from 'zod';
import { groupTypeSchema } from 'src/app/groups/models/group-types';
import { snakeToCamelKeys } from 'src/app/utils/case_conversion';

const itemOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: groupTypeSchema,
});

const itemOwnersSchema = z.array(itemOwnerSchema);

export type ItemOwner = z.infer<typeof itemOwnerSchema>;

export function parseItemOwners(raw: unknown): ItemOwner[] {
  return itemOwnersSchema.parse(snakeToCamelKeys(raw));
}
