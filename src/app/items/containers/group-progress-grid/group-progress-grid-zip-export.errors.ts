import { HttpErrorResponse } from '@angular/common/http';
import { SECONDS } from 'src/app/utils/duration';

export type ZipExportErrorFeedback =
  | { type: 'message', message: string, life?: number }
  | { type: 'unexpected' };

export function readHttpActionError(error: unknown): { status: number, errorText?: string } {
  if (!(error instanceof HttpErrorResponse)) {
    throw error;
  }

  const body: unknown = error.error;
  if (typeof body === 'object' && body !== null && 'error_text' in body) {
    const errorText = (body as { error_text?: unknown }).error_text;
    if (typeof errorText === 'string') {
      return { status: error.status, errorText };
    }
  }

  return { status: error.status };
}

export function mapZipExportError(status: number, errorText?: string): ZipExportErrorFeedback {
  if (errorText?.includes('The number of user-item entries exceeds the limit')) {
    return {
      type: 'message',
      message: $localize`Export is too large (users × items exceeds 100\u202f000). Narrow the group or the selected items.`,
      life: 10 * SECONDS,
    };
  }

  if (status === 403) {
    return {
      type: 'message',
      message: $localize`You do not have permission to export answers for this activity.`,
    };
  }

  if (status === 401) {
    return {
      type: 'message',
      message: $localize`You are not authorized to perform this action.`,
    };
  }

  if (status === 0 || status >= 500) {
    return {
      type: 'message',
      message: $localize`The export service is temporarily unavailable. Please try again later.`,
    };
  }

  if (status === 404) {
    return {
      type: 'message',
      message: $localize`The export could not be started. Please try again.`,
    };
  }

  return { type: 'unexpected' };
}
