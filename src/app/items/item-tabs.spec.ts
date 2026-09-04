import { Result } from './models/attempts';
import { shouldShowAttemptsTab } from './item-tabs';

function resultStub(attemptId: string): Result {
  return {
    attemptId,
    latestActivityAt: new Date(0),
    startedAt: null,
    score: 0,
    validated: false,
    allowsSubmissionsUntil: new Date(0),
  };
}

describe('shouldShowAttemptsTab', () => {
  it('returns true when the item allows multiple attempts', () => {
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: true }, undefined)).toBe(true);
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: true }, [])).toBe(true);
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: true }, [ resultStub('1') ])).toBe(true);
  });

  it('treats undefined results as length 0', () => {
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: false }, undefined)).toBe(false);
  });

  it('returns false when there are 0 results and multiple attempts are not allowed', () => {
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: false }, [])).toBe(false);
  });

  it('returns false when there is exactly 1 result and multiple attempts are not allowed', () => {
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: false }, [ resultStub('1') ])).toBe(false);
  });

  it('returns true when there are more than 1 results', () => {
    expect(shouldShowAttemptsTab(
      { allowsMultipleAttempts: false },
      [ resultStub('1'), resultStub('2') ],
    )).toBe(true);
  });

  it('returns false when both conditions are false', () => {
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: false }, undefined)).toBe(false);
    expect(shouldShowAttemptsTab({ allowsMultipleAttempts: false }, [ resultStub('1') ])).toBe(false);
  });
});
