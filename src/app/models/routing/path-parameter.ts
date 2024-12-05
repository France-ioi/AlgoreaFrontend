import { ParamMap } from '@angular/router';
import { UrlCommandParameters } from '../../utils/url';
import { fromRouter } from 'src/app/store/router';
import { createSelector } from '@ngrx/store';

/**
 * How the path parameter is named in the routing parameters / urls
 */
const pathParamName = 'p';

export function pathFromRouterParameters(params: ParamMap): string[]|null {
  const pathAsString = params.get(pathParamName);
  if (pathAsString === null) return null;
  return parsePath(pathAsString);
}

export function pathAsParameter(value: string[]): UrlCommandParameters {
  const params: UrlCommandParameters = {};
  params[pathParamName] = value;
  return params;
}

/**
 * A selector on the path parameter extracted from the route
 * Using this selector instead of getting it from param map allows memoizing
 */
export const selectPathParameter = createSelector(
  fromRouter.selectParam(pathParamName),
  rawPath => (rawPath !== null ? parsePath(rawPath) : null)
);


function parsePath(path: string): string[] {
  return path === '' ? [] : path.split(',');
}
