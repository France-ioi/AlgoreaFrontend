import { z } from 'zod/v4';

const itemContentViewPermPropagationSchema = z.enum([ 'none', 'as_info', 'as_content' ]);
const itemUpperViewLevelsPermPropagationSchema = z.enum([ 'use_content_view_propagation', 'as_content_with_descendants', 'as_is' ]);
const itemEditPermPropagationSchema = z.boolean();
const itemGrantViewPermPropagationSchema = z.boolean();
const itemWatchPermPropagationSchema = z.boolean();

export const itemPermPropagationsSchema = z.object({
  contentViewPropagation: itemContentViewPermPropagationSchema,
  upperViewLevelsPropagation: itemUpperViewLevelsPermPropagationSchema,
  editPropagation: itemEditPermPropagationSchema,
  grantViewPropagation: itemGrantViewPermPropagationSchema,
  watchPropagation: itemWatchPermPropagationSchema,
});

export type ItemPermPropagations = z.infer<typeof itemPermPropagationsSchema>;
export const itemContentViewPermPropagationEnum = itemContentViewPermPropagationSchema.enum;
export const itemUpperViewLevelsPermPropagationEnum = itemUpperViewLevelsPermPropagationSchema.enum;

export const itemContentViewPermPropagationValues = itemContentViewPermPropagationSchema.options;
export const itemUpperViewLevelsPermPropagationValues = itemUpperViewLevelsPermPropagationSchema.options;
