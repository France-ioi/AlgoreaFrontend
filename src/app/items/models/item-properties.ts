import { z } from 'zod';

export const itemValidationTypeSchema = z.enum([ 'None','All','AllButOne','Categories','One','Manual' ]);

export const itemFullScreenSchema = z.enum([ 'forceYes','forceNo','default' ]);

export const itemChildrenLayoutSchema = z.enum([ 'List', 'Grid' ]);

export const itemEntryMinAdmittedMembersRatioSchema = z.enum([ 'All', 'Half', 'One', 'None' ]);

export const itemChildCategorySchema = z.enum([ 'Undefined', 'Discovery', 'Application', 'Validation', 'Challenge' ]);
export type ItemChildCategory = z.infer<typeof itemChildCategorySchema>;
