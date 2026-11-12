import {
  negotiateApiVersion,
  PLATFORM_MAX_API_VERSION,
  PLATFORM_MIN_API_VERSION,
  savesEditorHistory,
} from './task-api-version';

describe('negotiateApiVersion', () => {
  it('should default to version 1 when metadata omits apiVersion fields', () => {
    expect(negotiateApiVersion()).toBe(1);
  });

  it('should pick the highest version in the overlapping range', () => {
    expect(negotiateApiVersion(1, 2)).toBe(2);
  });

  it('should cap at the platform max supported version', () => {
    expect(negotiateApiVersion(1, 99)).toBe(PLATFORM_MAX_API_VERSION);
  });

  it('should floor at the platform min supported version', () => {
    expect(negotiateApiVersion(0, 1)).toBe(PLATFORM_MIN_API_VERSION);
  });

  it('should return null when there is no overlapping version range', () => {
    expect(negotiateApiVersion(99, 99)).toBeNull();
    expect(negotiateApiVersion(PLATFORM_MAX_API_VERSION + 1, PLATFORM_MAX_API_VERSION + 5)).toBeNull();
  });

  it('should accept a task that only supports version 1', () => {
    expect(negotiateApiVersion(1, 1)).toBe(PLATFORM_MIN_API_VERSION);
  });

  it('should negotiate version 3 when the task supports it', () => {
    expect(negotiateApiVersion(1, 3)).toBe(3);
    expect(PLATFORM_MAX_API_VERSION).toBe(3);
  });
});

describe('savesEditorHistory', () => {
  it('should be true only when negotiated version is at least 3 and savesHistory is true', () => {
    expect(savesEditorHistory(3, true)).toBe(true);
    expect(savesEditorHistory(3, false)).toBe(false);
    expect(savesEditorHistory(3, undefined)).toBe(false);
    expect(savesEditorHistory(2, true)).toBe(false);
    expect(savesEditorHistory(1, true)).toBe(false);
  });
});
