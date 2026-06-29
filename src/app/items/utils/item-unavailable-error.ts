import { errorHasName, errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { NO_SUCH_ALIAS_ERROR_NAME } from './item-route-validation';

/**
 * Whether an error means the item cannot be shown to the user (forbidden, not found or unresolvable alias),
 * which should trigger the "restricted content" display rather than a generic error.
 */
export function isItemUnavailableError(error: unknown): boolean {
  return errorIsHTTPForbidden(error) || errorIsHTTPNotFound(error) || errorHasName(error, NO_SUCH_ALIAS_ERROR_NAME);
}
