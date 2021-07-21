import { codeAdditions,isSameCodeLifetime } from './group-code';
import { Duration } from 'src/app/shared/helpers/duration';

describe('GroupCode', () => {

  describe('when the user cannot see the code', () => {
    const group = {};

    it('should return expected values', () => {
      const g = codeAdditions(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.codeLifetime).toBeUndefined();
      expect(g.hasCodeUnused).toBeFalse();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has no code set', () => {
    const group = { code: null as string|null, codeLifetime: null as number|null, codeExpiresAt: null as string|null };

    it('should return expected values', () => {
      const g = codeAdditions(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.codeLifetime).toBeNull();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has a unused code', () => {
    const group = { code: 'abcd', codeLifetime: Duration.fromString('1:02:03').ms / 1000, codeExpiresAt: null as string|null };

    it('should return expected values', () => {
      const g = codeAdditions(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.codeLifetime).toEqual(Duration.fromHMS(1,2,3));
      expect(g.hasCodeUnused).toBeTruthy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has a code already used', () => {
    const group = { code: 'abcd', codeLifetime: Duration.fromString('1:02:03').ms / 1000, codeExpiresAt: '2020-01-01T10:02:03.00' };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 09:30'));
    });

    it('should return expected values', () => {
      const g = codeAdditions(group);
      expect(g.codeExpiration).toEqual(new Date('2020-01-01 10:02:03'));
      expect(g.codeLifetime).toEqual(Duration.fromHMS(1,2,3));
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeTruthy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toEqual(new Date('2020-01-01 09:00'));
      expect(g.durationBeforeCodeExpiration).toEqual(Duration.fromHMS(0,32,3));
      expect(g.durationSinceFirstCodeUse).toEqual(Duration.fromHMS(0,30,0));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });
  });

  describe('when the group has an expired code', () => {
    const group = { code: 'abcd', codeLifetime: Duration.fromString('1:02:03').ms / 1000, codeExpiresAt: '2020-01-01T10:02:03.00' };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 11:30'));
    });

    it('should return expected values', () => {
      const g = codeAdditions(group);
      expect(g.codeExpiration).toEqual(new Date('2020-01-01 10:02:03'));
      expect(g.codeLifetime).toEqual(Duration.fromHMS(1,2,3));
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeTruthy();
      expect(g.codeFirstUseDate).toEqual(new Date('2020-01-01 09:00'));
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
