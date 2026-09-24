import { SECONDS } from 'src/app/utils/duration';

/**
 * Invalid expiresAt (non-finite) is treated as expired so a bad payload cannot look downloadable.
 */
export function isExportExpiresAtPast(expiresAt: number, nowMs = Date.now()): boolean {
  return !Number.isFinite(expiresAt) || expiresAt <= nowMs;
}

export function formatExportItemTitles(items: { title: string }[]): string {
  return items.map(item => item.title).filter(title => title.length > 0).join(', ');
}

export function exportReadySummary(groupName: string, items: { title: string }[]): string {
  const titles = formatExportItemTitles(items);
  return titles.length > 0
    ? $localize`Export of ${groupName}:groupName: — ${titles}:itemTitles: is ready`
    : $localize`Export of ${groupName}:groupName: is ready`;
}

export function mapExportFailureReason(error: string): string {
  const normalized = error.toLowerCase();
  if (normalized.includes('too_many_entries') || normalized.includes('user-item entries exceeds')) {
    return $localize`users × items exceeds 100\u202f000`;
  }
  if (normalized.includes('timeout')) {
    return $localize`the export timed out`;
  }
  if (normalized.includes('permission') || normalized.includes('forbidden')) {
    return $localize`insufficient permissions`;
  }
  return $localize`an unexpected error occurred`;
}

export function exportFailedSummary(groupName: string, error: string): string {
  const reason = mapExportFailureReason(error);
  return $localize`Export of ${groupName}:groupName: failed (${reason}:reason:)`;
}

export function mapConfiguredExportServiceError(): { type: 'message', message: string, life?: number } {
  return {
    type: 'message',
    message: $localize`The export service is not configured.`,
    life: 8 * SECONDS,
  };
}
