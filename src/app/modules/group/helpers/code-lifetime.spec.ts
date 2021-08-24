import { Duration } from 'src/app/shared/helpers/duration';
import { CodeLifetime } from './code-lifetime';

describe('CodeLifetime', () => {
  describe('when infinite', () => {
    const lifetime = new CodeLifetime(CodeLifetime.infiniteValue);
    it('should be marked as infinite', () => {
      expect(lifetime.infinite).toBeTrue();
    });

    it('should not be marked as usable once', () => {
      expect(lifetime.usableOnce).toBeFalse();
    });

    it('should have a null value in seconds', () => {
      expect(lifetime.valueInSeconds).toBeNull();
    });
  });

  describe('when usable once', () => {
    const lifetime = new CodeLifetime(CodeLifetime.usableOnceValue);

    it('should not be marked as infinite', () => {
      expect(lifetime.infinite).toBeFalse();
    });

    it('should be marked as usable once', () => {
      expect(lifetime.usableOnce).toBeTrue();
    });

    it('should have "0" as value in seconds', () => {
      expect(lifetime.valueInSeconds).toBe(0);
    });
  });

  describe('when a duration is defined', () => {
    const seconds = 10;
    const lifetime = new CodeLifetime(Duration.fromSeconds(seconds).ms);

    it('should not be marked as infinite', () => {
      expect(lifetime.infinite).toBeFalse();
    });

    it('should be marked as usable once', () => {
      expect(lifetime.usableOnce).toBeFalse();
    });

    it('should have value in seconds', () => {
      expect(lifetime.valueInSeconds).toBe(seconds);
    });
  });
});
