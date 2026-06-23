import { selectActiveItemNoScore } from './scores';

describe('selectActiveItemNoScore', () => {
  it('returns noScore when an item is active', () => {
    expect(selectActiveItemNoScore.projector({ noScore: true } as Parameters<typeof selectActiveItemNoScore.projector>[0])).toBe(true);
    expect(selectActiveItemNoScore.projector({ noScore: false } as Parameters<typeof selectActiveItemNoScore.projector>[0])).toBe(false);
  });

  it('returns undefined when there is no active item', () => {
    expect(selectActiveItemNoScore.projector(null)).toBeUndefined();
  });
});
