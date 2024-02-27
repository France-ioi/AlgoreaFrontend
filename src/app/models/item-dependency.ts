import { z } from 'zod';
import { durationSchema } from '../utils/decoders';
import { participantTypeSchema } from './group-types';
import { itemCorePermSchema } from './item-permissions';
import { itemStringSchema } from './item-string';
import { itemTypeSchema } from './item-type';
import { itemValidationTypeSchema } from './item-properties';
import { itemViewPermSchema } from './item-view-permission';

export const itemDependencySchema = z.object({
  id: z.string(),
  type: itemTypeSchema,
  allowsMultipleAttempts: z.boolean(),
  bestScore: z.number(),
  defaultLanguageTag: z.string(),
  dependencyGrantContentView: z.boolean(),
  dependencyRequiredScore: z.number(),
  displayDetailsInParent: z.boolean(),
  duration: durationSchema.nullable(),
  entryParticipantType: participantTypeSchema,
  noScore: z.boolean(),
  permissions: itemCorePermSchema,
  requiresExplicitEntry: z.boolean(),
  string: itemStringSchema,
  validationType: itemValidationTypeSchema,
  watchedGroup: itemViewPermSchema.and(z.object({ allValidated: z.boolean().optional(), avgScore: z.number().optional() })).optional(),
});
