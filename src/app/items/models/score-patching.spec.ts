import { patchItemScore, patchResultScore } from './score-patching';
import { Result } from './attempts';
import { Item } from 'src/app/data-access/get-item-by-id.service';

describe('patchResultScore', () => {
  const base: Result = {
    attemptId: '42',
    latestActivityAt: new Date(),
    startedAt: new Date(),
    score: 10,
    validated: false,
    allowsSubmissionsUntil: new Date(),
  };

  it('patches only the matching attempt entry', () => {
    const other: Result = { ...base, attemptId: '99', score: 5 };
    const patched = patchResultScore([ base, other ], '42', 50);
    expect(patched[0]?.score).toBe(50);
    expect(patched[0]?.validated).toBeFalse();
    expect(patched[1]?.score).toBe(5);
  });

  it('keeps the higher of the existing and new score', () => {
    const patched = patchResultScore([ base ], '42', 5);
    expect(patched[0]?.score).toBe(10);
  });

  it('marks validated when the new score is 100', () => {
    const patched = patchResultScore([ base ], '42', 100);
    expect(patched[0]?.validated).toBeTrue();
    expect(patched[0]?.score).toBe(100);
  });
});

describe('patchItemScore', () => {
  it('raises bestScore when the new score is higher', () => {
    const item = { bestScore: 20 } as Item;
    expect(patchItemScore(item, 50).bestScore).toBe(50);
    expect(patchItemScore(item, 10).bestScore).toBe(20);
  });
});
