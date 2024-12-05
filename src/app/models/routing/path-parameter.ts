import { ParamMap } from '@angular/router';
import { UrlCommandParameters } from '../../utils/url';

export const pathParamName = 'p';

export function pathFromRouterParameters(params: ParamMap): string[]|null {
  const pathAsString = params.get(pathParamName);
  if (pathAsString === null) return null;
  return pathFromParamValue(pathAsString);
}

export function pathFromParamValue(path: string): string[] {
  return path === '' ? [] : path.split(',');
}

export function pathAsParameter(value: string[]): UrlCommandParameters {
  const params: UrlCommandParameters = {};
  params[pathParamName] = value;
  return params;
}
