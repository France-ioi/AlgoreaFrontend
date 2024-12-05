import { fromRouter } from 'src/app/store/router';

/**
 * A selector on the "id" parameter extracted from the route.
 * Using this selector instead of getting it from param map allows memoizing
 */
export const selectIdParameter = fromRouter.selectParam('id');
