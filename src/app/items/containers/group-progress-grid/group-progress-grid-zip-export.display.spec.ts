import {
  exportFailedSummary,
  exportReadySummary,
  isExportExpiresAtPast,
  mapExportFailureReason,
} from './group-progress-grid-zip-export.display';

describe('group-progress-grid-zip-export.display', () => {
  it('treats invalid or past expiresAt as expired', () => {
    const now = Date.parse('2025-01-01T00:00:00.000Z');
    expect(isExportExpiresAtPast(Number.NaN, now)).toBeTrue();
    expect(isExportExpiresAtPast(1893456000000, now)).toBeFalse();
    expect(isExportExpiresAtPast(1577836800000, now)).toBeTrue();
  });

  it('omits dangling em dash when items are empty', () => {
    expect(exportReadySummary('Class A', [])).toBe('Export of Class A is ready');
    expect(exportReadySummary('Class A', [ { title: 'Chapter 1' } ])).toContain('— Chapter 1');
  });

  it('maps machine failure codes to user-facing reasons', () => {
    expect(mapExportFailureReason('too_many_entries')).toMatch(/100/);
    expect(mapExportFailureReason('Timeout')).toMatch(/timed out/i);
    expect(mapExportFailureReason('weird-stack')).toMatch(/unexpected error/i);
    expect(exportFailedSummary('Class A', 'Timeout')).toMatch(/failed \(the export timed out\)/i);
  });
});
