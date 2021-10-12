import { ParamMap } from '@angular/router';
import { UrlCommandParameters } from '../helpers/url';

/* for url */
const pathParamName = 'path';

type Id = string;

export interface ContentRoute {
  contentType: string,
  id: Id,
  path: Id[],
}

export function pathFromRouterParameters(params: ParamMap): string|null {
  return params.get(pathParamName);
}

export function pathAsParameter(value: string[]): UrlCommandParameters {
  const params: UrlCommandParameters = {};
  params[pathParamName] = value;
  return params;
}
