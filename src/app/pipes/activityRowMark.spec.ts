import { activityRowMark } from './activityRowMark';

describe('activityRowMark', () => {
  it('keeps a floppy on a saved answer even when a score is present', () => {
    expect(activityRowMark('saved_answer', 0)).toEqual({
      kind: 'icon',
      iconClass: 'ph-duotone ph-floppy-disk-back',
    });
  });

  it('uses the same floppy for a current answer', () => {
    expect(activityRowMark('current_answer', undefined)).toEqual({
      kind: 'icon',
      iconClass: 'ph-duotone ph-floppy-disk-back',
    });
  });

  it('draws the score ring for a submission scored 0', () => {
    expect(activityRowMark('submission', 0)).toEqual({ kind: 'score' });
  });

  it('leaves a submission with no score empty', () => {
    expect(activityRowMark('submission', undefined)).toEqual({ kind: 'icon', iconClass: '' });
  });

  it('draws the score ring for activity started when a score is present', () => {
    expect(activityRowMark('result_started', 40)).toEqual({ kind: 'score' });
  });

  it('keeps the checkered flag when activity started has no score', () => {
    expect(activityRowMark('result_started', undefined)).toEqual({
      kind: 'icon',
      iconClass: 'ph-duotone ph-flag-checkered',
    });
  });

  it('draws the score ring for activity validated when a score is present, including 0', () => {
    expect(activityRowMark('result_validated', 0)).toEqual({ kind: 'score' });
  });

  it('keeps the check when activity validated has no score', () => {
    expect(activityRowMark('result_validated', undefined)).toEqual({
      kind: 'icon',
      iconClass: 'ph ph-check-circle alg-font-size-38',
    });
  });
});
