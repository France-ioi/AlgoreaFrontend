import { SECONDS } from 'src/app/utils/duration';

export type ZipExportErrorFeedback =
  | { type: 'message', message: string, life?: number }
  | { type: 'unexpected' };

export function mapZipExportError(status: number, errorText?: string): ZipExportErrorFeedback {
  if (errorText?.includes('The number of items exceeds the limit')) {
    return {
      type: 'message',
      // eslint-disable-next-line max-len
      message: $localize`Export is limited to 100 items. Open a sub-chapter, then export again from that chapter's progress page.`,
      life: 10 * SECONDS,
    };
  }

  if (errorText?.includes('The number of users exceeds the limit')) {
    return {
      type: 'message',
      // eslint-disable-next-line max-len
      message: $localize`Export is limited to 100 users. Open a sub-group, then export again from that group's progress page.`,
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

  return { type: 'unexpected' };
}
