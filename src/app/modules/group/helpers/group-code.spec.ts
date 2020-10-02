import { withCodeAdditions } from './group-code';
import { Duration } from 'src/app/shared/helpers/duration';

describe('GroupCode', () => {

  describe('when the user cannot see the code', () => {
    const group = {};

    it('should set expected values', () => {
      const g = withCodeAdditions(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.codeLifetime).toBeUndefined();
      expect(g.hasCodeNotSet).toBeTruthy(); // even if irrelevant
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has no code set', () => {
    const group = { code: null as string|null, code_lifetime: null as string|null, code_expires_at: null as string|null };

    it('should set expected values', () => {
      const g = withCodeAdditions(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.codeLifetime).toBeUndefined();
      expect(g.hasCodeNotSet).toBeTruthy();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has a unused code', () => {
    const group = { code: 'abcd', code_lifetime: '1:02:03', code_expires_at: null as string|null };

    it('should set expected values', () => {
      const g = withCodeAdditions(group);
      expect(g.codeExpiration).toBeUndefined();
      expect(g.codeLifetime).toEqual(Duration.fromHMS(1,2,3));
      expect(g.hasCodeNotSet).toBeFalsy();
      expect(g.hasCodeUnused).toBeTruthy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeFalsy();
      expect(g.codeFirstUseDate).toBeUndefined();
      expect(g.durationBeforeCodeExpiration).toBeUndefined();
      expect(g.durationSinceFirstCodeUse).toBeUndefined();
    });
  });

  describe('when the group has a code already used', () => {
    const group = { code: 'abcd', code_lifetime: '1:02:03', code_expires_at: '2020-01-01T10:02:03.00' };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 09:30'));
    });

    it('should set expected values', () => {
      const g = withCodeAdditions(group);
      expect(g.codeExpiration).toEqual(new Date('2020-01-01 10:02:03'));
      expect(g.codeLifetime).toEqual(Duration.fromHMS(1,2,3));
      expect(g.hasCodeNotSet).toBeFalsy();
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
    const group = { code: 'abcd', code_lifetime: '1:02:03', code_expires_at: '2020-01-01T10:02:03.00' };

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2020-01-01 11:30'));
    });

    it('should set expected values', () => {
      const g = withCodeAdditions(group);
      expect(g.codeExpiration).toEqual(new Date('2020-01-01 10:02:03'));
      expect(g.codeLifetime).toEqual(Duration.fromHMS(1,2,3));
      expect(g.hasCodeNotSet).toBeFalsy();
      expect(g.hasCodeUnused).toBeFalsy();
      expect(g.hasCodeInUse).toBeFalsy();
      expect(g.hasCodeExpired).toBeTruthy();
      expect(g.codeFirstUseDate).toEqual(new Date('2020-01-01 09:00'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });
  });

});
