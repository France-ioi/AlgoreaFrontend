import { codeInfo } from './group-code';
import { Duration } from 'src/app/utils/duration';
import { CodeLifetime } from './code-lifetime';

describe('GroupCode', () => {

  describe('when the user cannot see the code', () => {
    const group = {};

    it('should return expected values', () => {
      const g = codeInfo(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.hasCodeNotSet).toBeTruthy(); // even if irrelevant
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasUnexpiringCode).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has no code set', () => {
    const group = {
      code: null as string|null,
      codeLifetime: new CodeLifetime(CodeLifetime.infiniteValue),
      codeExpiresAt: null as string|null,
    };

    it('should return expected values', () => {
      const g = codeInfo(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.hasCodeNotSet).toBeTruthy();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasUnexpiringCode).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has a unused code', () => {
    const group = {
      code: 'abcd',
      codeLifetime: new CodeLifetime(Duration.fromString('1:02:03').ms),
      codeExpiresAt: null as string|null,
    };

    it('should return expected values', () => {
      const g = codeInfo(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.hasCodeNotSet).toBeFalsy();
      expect(g.hasCodeUnused).toBeTruthy();
      expect(g.hasUnexpiringCode).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has a code already used', () => {
    const group = {
      code: 'abcd',
      codeLifetime: new CodeLifetime(Duration.fromString('1:02:03').ms),
      codeExpiresAt: '2020-01-01T10:02:03.00',
    };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 09:30'));
    });

    it('should return expected values', () => {
      const g = codeInfo(group);
      expect(g.codeExpiration).toEqual(new Date('2020-01-01 10:02:03'));
      expect(g.hasCodeNotSet).toBeFalsy();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasUnexpiringCode).toBeFalsy();
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
    const group = {
      code: 'abcd',
      codeLifetime: new CodeLifetime(Duration.fromString('1:02:03').ms),
      codeExpiresAt: '2020-01-01T10:02:03.00',
    };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 11:30'));
    });

    it('should return expected values', () => {
      const g = codeInfo(group);
      expect(g.codeExpiration).toEqual(new Date('2020-01-01 10:02:03'));
      expect(g.hasCodeNotSet).toBeFalsy();
      expect(g.hasUnexpiringCode).toBeFalsy();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeTruthy();
      expect(g.codeFirstUseDate).toEqual(new Date('2020-01-01 09:00'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });
  });

  describe('when the group has an unexpiring code', () => {
    const group = { code: 'abcd', codeLifetime: new CodeLifetime(Infinity), codeExpiresAt: null as string|null };

    it('should return expected values', () => {
      const g = codeInfo(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.hasCodeNotSet).toBeFalsy();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasUnexpiringCode).toBeTruthy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });
});
