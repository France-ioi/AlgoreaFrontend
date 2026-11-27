import { opensTaskReadOnly } from './task-read-only';

describe('opensTaskReadOnly', () => {
  it('is read-only when the route names a specific answer', () => {
    expect(opensTaskReadOnly({ answer: { id: '7' } }, null, false)).toBeTrue();
  });

  it('is read-only when the route names an answer, even for an own History load', () => {
    expect(opensTaskReadOnly({ answer: { id: '7' } }, { attemptId: '0' }, false)).toBeTrue();
  });

  it('is read-only when History loads an observed participant attempt', () => {
    expect(opensTaskReadOnly({}, { attemptId: '0', observedParticipantId: 'u1' }, false)).toBeTrue();
  });

  it('is read-only when the current attempt no longer accepts submissions', () => {
    expect(opensTaskReadOnly({}, null, true)).toBeTrue();
  });

  it('is read-only for an own History load of an attempt that no longer accepts submissions', () => {
    expect(opensTaskReadOnly({}, { attemptId: '0' }, true)).toBeTrue();
  });

  it('is editable for an own History load of an open attempt', () => {
    expect(opensTaskReadOnly({}, { attemptId: '0' }, false)).toBeFalse();
  });

  it('is editable with neither an answer, a History load nor a closed attempt', () => {
    expect(opensTaskReadOnly({}, null, false)).toBeFalse();
  });
});
