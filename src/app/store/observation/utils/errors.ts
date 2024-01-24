import { errorHasTag, errorIsHTTPForbidden, tagError } from 'src/app/utils/errors';

const cannotWatchErrorTag = 'observationForbiddenError';

export const cannotWatchError = tagError(new Error('cannot watch'), cannotWatchErrorTag);

export function isForbiddenObservationError(error: any): boolean {
  return errorIsHTTPForbidden(error) || errorHasTag(error, cannotWatchErrorTag);
}
