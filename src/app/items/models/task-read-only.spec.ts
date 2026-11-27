import { opensTaskReadOnly } from './task-read-only';

describe('opensTaskReadOnly', () => {
  it('is read-only when the route names a specific answer', () => {
    expect(opensTaskReadOnly({ answer: { id: '7' } }, null)).toBeTrue();
  });

  it('is read-only when the route names an answer, even for an own History load', () => {
    expect(opensTaskReadOnly({ answer: { id: '7' } }, { attemptId: '0' })).toBeTrue();
  });

  it('is read-only when History loads an observed participant attempt', () => {
    expect(opensTaskReadOnly({}, { attemptId: '0', observedParticipantId: 'u1' })).toBeTrue();
  });

  it('is editable for an own History load', () => {
    expect(opensTaskReadOnly({}, { attemptId: '0' })).toBeFalse();
  });

  it('is editable with neither an answer nor a History load', () => {
    expect(opensTaskReadOnly({}, null)).toBeFalse();
  });
});
