import { ParamMap } from '@angular/router';
import { UrlCommandParameters } from '../helpers/url';

/* for url */
const pathParamName = 'p';

type Id = string;

export interface ContentRoute {
  contentType: string,
  id: Id,
  path: Id[],
}

export function pathFromRouterParameters(params: ParamMap): string[]|null {
  const pathAsString = params.get(pathParamName);
  if (pathAsString === null) return null;
  return pathAsString === '' ? [] : pathAsString.split(',');
}

export function pathAsParameter(value: string[]): UrlCommandParameters {
  const params: UrlCommandParameters = {};
  params[pathParamName] = value;
  return params;
}
