import { createSelector } from '@ngrx/store';
import { fromRouter } from 'src/app/store/router';
import { pathFromParamValue, pathParamName } from './path-parameter';

/**
 * A selector on the "id" parameter extracted from the route.
 * Using this selector instead of getting it from param map allows memoizing
 */
export const selectIdParameter = fromRouter.selectParam('id');

const selectRawPathParameter = fromRouter.selectParam(pathParamName);

/**
 * A selector on the path parameter extracted from the route
 * Using this selector instead of getting it from param map allows memoizing
 */
export const selectPathParameter = createSelector(
  selectRawPathParameter,
  rawPath => (rawPath !== null ? pathFromParamValue(rawPath) : null)
);
