import { SECONDS } from 'src/app/utils/duration';

export function mapConfiguredExportServiceError(): { type: 'message', message: string, life?: number } {
  return {
    type: 'message',
    message: $localize`The export service is not configured.`,
    life: 8 * SECONDS,
  };
}
