import {
  codeExpiration,
  codeFirstUseDate,
  codeLifetime,
  durationBeforeCodeExpiration,
  durationSinceFirstCodeUse,
  hasCodeExpired,
  hasCodeInUse,
  hasCodeNotSet,
  hasCodeUnused,
  isSameCodeLifetime,
} from './group-code';
import { Duration } from 'src/app/shared/helpers/duration';

describe('GroupCode', () => {

  describe('when the user cannot see the code', () => {
    const group = {};

    it('should return expected values', () => {
      expect(codeExpiration(group)).toBeUndefined();
      expect(codeLifetime(group)).toBeUndefined();
      expect(hasCodeNotSet(group)).toBeTruthy(); // even if irrelevant
      expect(hasCodeUnused(group)).toBeFalsy();
      expect(hasCodeInUse(group)).toBeFalsy();
      expect(hasCodeExpired(group)).toBeFalsy();
      expect(codeFirstUseDate(group)).toBeUndefined();
      expect(durationBeforeCodeExpiration(group)).toBeUndefined();
      expect(durationSinceFirstCodeUse(group)).toBeUndefined();
    });
  });

  describe('when the group has no code set', () => {
    const group = { code: null as string|null, codeLifetime: null as string|null, codeExpiresAt: null as string|null };

    it('should return expected values', () => {
      expect(codeExpiration(group)).toBeUndefined();
      expect(codeLifetime(group)).toBeNull();
      expect(hasCodeNotSet(group)).toBeTruthy();
      expect(hasCodeUnused(group)).toBeFalsy();
      expect(hasCodeInUse(group)).toBeFalsy();
      expect(hasCodeExpired(group)).toBeFalsy();
      expect(codeFirstUseDate(group)).toBeUndefined();
      expect(durationBeforeCodeExpiration(group)).toBeUndefined();
      expect(durationSinceFirstCodeUse(group)).toBeUndefined();
    });
  });

  describe('when the group has a unused code', () => {
    const group = { code: 'abcd', codeLifetime: '1:02:03', codeExpiresAt: null as string|null };

    it('should return expected values', () => {
      expect(codeExpiration(group)).toBeUndefined();
      expect(codeLifetime(group)).toEqual(Duration.fromHMS(1,2,3));
      expect(hasCodeNotSet(group)).toBeFalsy();
      expect(hasCodeUnused(group)).toBeTruthy();
      expect(hasCodeInUse(group)).toBeFalsy();
      expect(hasCodeExpired(group)).toBeFalsy();
      expect(codeFirstUseDate(group)).toBeUndefined();
      expect(durationBeforeCodeExpiration(group)).toBeUndefined();
      expect(durationSinceFirstCodeUse(group)).toBeUndefined();
    });
  });

  describe('when the group has a code already used', () => {
    const group = { code: 'abcd', codeLifetime: '1:02:03', codeExpiresAt: '2020-01-01T10:02:03.00' };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 09:30'));
    });

    it('should return expected values', () => {
      expect(codeExpiration(group)).toEqual(new Date('2020-01-01 10:02:03'));
      expect(codeLifetime(group)).toEqual(Duration.fromHMS(1,2,3));
      expect(hasCodeNotSet(group)).toBeFalsy();
      expect(hasCodeUnused(group)).toBeFalsy();
      expect(hasCodeInUse(group)).toBeTruthy();
      expect(hasCodeExpired(group)).toBeFalsy();
      expect(codeFirstUseDate(group)).toEqual(new Date('2020-01-01 09:00'));
      expect(durationBeforeCodeExpiration(group)).toEqual(Duration.fromHMS(0,32,3));
      expect(durationSinceFirstCodeUse(group)).toEqual(Duration.fromHMS(0,30,0));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });
  });

  describe('when the group has an expired code', () => {
    const group = { code: 'abcd', codeLifetime: '1:02:03', codeExpiresAt: '2020-01-01T10:02:03.00' };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 11:30'));
    });

    it('should return expected values', () => {
      expect(codeExpiration(group)).toEqual(new Date('2020-01-01 10:02:03'));
      expect(codeLifetime(group)).toEqual(Duration.fromHMS(1,2,3));
      expect(hasCodeNotSet(group)).toBeFalsy();
      expect(hasCodeUnused(group)).toBeFalsy();
      expect(hasCodeInUse(group)).toBeFalsy();
      expect(hasCodeExpired(group)).toBeTruthy();
      expect(codeFirstUseDate(group)).toEqual(new Date('2020-01-01 09:00'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });
  });

  describe('isSameCodeLifetime', () => {

    it('should return true', () => {
      expect(isSameCodeLifetime(new Duration(1000), new Duration(1000))).toBeTrue();
      expect(isSameCodeLifetime(null, null)).toBeTrue();
      expect(isSameCodeLifetime(0, 0)).toBeTrue();
    });

    it('should return false', () => {
      expect(isSameCodeLifetime(new Duration(1), null)).toBeFalse();
      expect(isSameCodeLifetime(new Duration(1), 0)).toBeFalse();
      expect(isSameCodeLifetime(null, 0)).toBeFalse();
      expect(isSameCodeLifetime(new Duration(1), new Duration(2))).toBeFalse();
    });
  });
});
