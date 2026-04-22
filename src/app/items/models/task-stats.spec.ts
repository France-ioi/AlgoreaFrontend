import { TaskStats } from '../data-access/get-task-stats.service';
import { formatDuration, formatPercent, formatScore, validationRate } from './task-stats';

describe('task-stats helpers', () => {
  describe('formatPercent', () => {
    it('returns "—" when the value is null', () => {
      expect(formatPercent(null)).toBe('—');
    });

    it('formats 0 as "0%"', () => {
      expect(formatPercent(0)).toBe('0%');
    });

    it('formats 100 as "100%"', () => {
      expect(formatPercent(100)).toBe('100%');
    });

    it('rounds to the nearest integer', () => {
      expect(formatPercent(42.4)).toBe('42%');
      expect(formatPercent(42.5)).toBe('43%');
      expect(formatPercent(42.6)).toBe('43%');
    });

    it('handles values above 100 and below 0 without clamping', () => {
      expect(formatPercent(150.2)).toBe('150%');
      expect(formatPercent(-3.7)).toBe('-4%');
    });
  });

  describe('formatScore', () => {
    it('returns "—" when the score is null', () => {
      expect(formatScore(null)).toBe('—');
    });

    it('formats numbers with one decimal place', () => {
      expect(formatScore(0)).toBe('0.0');
      expect(formatScore(73)).toBe('73.0');
      expect(formatScore(73.45)).toBe('73.5');
    });
  });

  describe('formatDuration', () => {
    it('returns "—" when the duration is null', () => {
      expect(formatDuration(null)).toBe('—');
    });

    it('returns a non-empty readable string for a positive duration', () => {
      const formatted = formatDuration(125_000);
      expect(typeof formatted).toBe('string');
      expect(formatted).not.toBe('—');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('validationRate', () => {
    function makeStats(scoreDistribution: TaskStats['scoreDistribution']): TaskStats {
      return {
        userCount: 0,
        medianTimeSpent: null,
        medianTimeToValidate: null,
        bounceRate: null,
        avgScore: null,
        scoreDistribution,
      };
    }

    it('returns null when no entry has a score of 100', () => {
      expect(validationRate(makeStats([{ score: 50, pctUsersAbove: 80, pctByTime: {} }]))).toBeNull();
    });

    it('returns the pctUsersAbove of the score=100 entry when present', () => {
      const stats = makeStats([
        { score: 50, pctUsersAbove: 80, pctByTime: {} },
        { score: 100, pctUsersAbove: 25, pctByTime: {} },
      ]);
      expect(validationRate(stats)).toBe(25);
    });

    it('returns null when scoreDistribution is empty', () => {
      expect(validationRate(makeStats([]))).toBeNull();
    });
  });
});
