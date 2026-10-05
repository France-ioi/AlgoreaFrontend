import { itemRoute } from 'src/app/models/routing/item-route';
import { isScoreForRoute, ScoreChange } from './score-change';

describe('isScoreForRoute', () => {
  const event: ScoreChange = { score: 100, itemId: '1', attemptId: '0' };

  it('returns true when item id and attempt id both match', () => {
    expect(isScoreForRoute(event, itemRoute('activity', '1', { attemptId: '0', path: [] }))).toBeTrue();
  });

  it('returns false when the item id does not match', () => {
    expect(isScoreForRoute(event, itemRoute('activity', '2', { attemptId: '0', path: [] }))).toBeFalse();
  });

  it('returns false when the attempt id does not match', () => {
    expect(isScoreForRoute(event, itemRoute('activity', '1', { attemptId: '9', path: [] }))).toBeFalse();
  });

  it('returns false when the route has no attempt id', () => {
    expect(isScoreForRoute(event, itemRoute('activity', '1', { parentAttemptId: 'p', path: [] }))).toBeFalse();
  });

  it('returns false when the route is null or undefined', () => {
    expect(isScoreForRoute(event, null)).toBeFalse();
    expect(isScoreForRoute(event, undefined)).toBeFalse();
  });
});
