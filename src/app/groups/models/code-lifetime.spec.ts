import { CodeLifetime } from './code-lifetime';

describe('CodeLifetime', () => {
  describe('when infinite', () => {
    const lifetime = new CodeLifetime(CodeLifetime.infiniteValue);
    it('should be marked as infinite', () => {
      expect(lifetime.isInfinite).toBeTrue();
    });

    it('should not be marked as usable once', () => {
      expect(lifetime.isUsableOnce).toBeFalse();
    });

    it('should have a null value in seconds', () => {
      expect(lifetime.valueInSeconds).toBeNull();
    });
  });

  describe('when usable once', () => {
    const lifetime = new CodeLifetime(CodeLifetime.usableOnceValue);

    it('should not be marked as infinite', () => {
      expect(lifetime.isInfinite).toBeFalse();
    });

    it('should be marked as usable once', () => {
      expect(lifetime.isUsableOnce).toBeTrue();
    });

    it('should have "0" as value in seconds', () => {
      expect(lifetime.valueInSeconds).toBe(0);
    });
  });

  describe('when a duration is defined', () => {
    const seconds = 10;
    const lifetime = new CodeLifetime(seconds * 1000);

    it('should not be marked as infinite', () => {
      expect(lifetime.isInfinite).toBeFalse();
    });

    it('should be marked as usable once', () => {
      expect(lifetime.isUsableOnce).toBeFalse();
    });

    it('should have value in seconds', () => {
      expect(lifetime.valueInSeconds).toBe(seconds);
    });
  });
});
