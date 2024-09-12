import { Duration, MAX_TIME_FORMAT_DURATION } from './duration';

const DURATION_STRING = '100:12:15';
const DURATION_STRING_IN_MS = 360735000;
const DURATION_INVALID_STRING = '100:';
const MAX_DURATION_STRING = '838:59:59';

describe('duration', () => {
  it('should return duration object from string', () => {
    const duration = new Duration(DURATION_STRING_IN_MS);
    expect(Duration.fromString(DURATION_STRING)).toEqual(duration);
  });

  it('should return duration object from days-hours-minutes tuple', () => {
    expect(Duration.fromDHM(1, 2, 30).getDHM()).toEqual([ '1', '2', '30' ]);
  });

  it('should return a duration object from an end date, when the end date is future', () => {
    const endDate = new Date(Date.parse('2000-01-01 20:00:00'));
    const now = new Date(Date.parse('2000-01-01 10:00:00'));
    expect(Duration.fromNowUntil(endDate, now).getHMS()).toEqual([ '10', '0', '0' ]);
  });

  it('should return a duration object from an end date, when the end date is past', () => {
    const endDate = new Date(Date.parse('2000-01-01 9:00:00'));
    const now = new Date(Date.parse('2000-01-01 10:00:00'));
    expect(Duration.fromNowUntil(endDate, now).getMs()).toEqual(0);
  });

  it('should return valid state', () => {
    expect(new Duration(MAX_TIME_FORMAT_DURATION).isValid()).toBeTrue();
  });

  it('should return invalid state', () => {
    expect(Duration.fromString(DURATION_INVALID_STRING).isValid()).toBeFalse();
    expect(new Duration(NaN).isValid()).toBeFalse();
  });

  it('should return ms result', () => {
    expect(Duration.fromString(DURATION_STRING).getMs()).toEqual(DURATION_STRING_IN_MS);
    expect(new Duration(MAX_TIME_FORMAT_DURATION).getMs()).toEqual(MAX_TIME_FORMAT_DURATION);
  });

  it('should return hours, minutes, seconds tuple', () => {
    expect(Duration.fromString(DURATION_STRING).getHMS()).toEqual([ '100', '12', '15' ]);
    expect(new Duration(MAX_TIME_FORMAT_DURATION).getHMS()).toEqual([ '838', '59', '59' ]);
  });

  it('should return formatted duration string', () => {
    expect(Duration.fromString(DURATION_STRING).toString()).toEqual(DURATION_STRING);
    expect(new Duration(MAX_TIME_FORMAT_DURATION).toString()).toEqual(MAX_DURATION_STRING);
  });

  it('should return result in seconds', () => {
    expect(Duration.fromString(DURATION_STRING).seconds()).toEqual(DURATION_STRING_IN_MS / 1000);
  });

  it('should return days, hours, minutes tuple', () => {
    expect(Duration.fromHMS(24 + 2, 30, 0).getDHM()).toEqual([ '1', '2', '30' ]);
  });

  describe('toCountdown', () => {
    it('should display days when there are', () => {
      expect(Duration.fromHMS(50, 30, 10).toCountdown()).toEqual('2d2h30m10s');
    });
    it('should display hours when < a day', () => {
      expect(Duration.fromHMS(4, 20, 10).toCountdown()).toEqual('4h20m10s');
    });
    it('should display hours when < a day, and minutes always on 2 digits', () => {
      expect(Duration.fromHMS(4, 5, 10).toCountdown()).toEqual('4h05m10s');
    });
    it('should display minutes on when < an hour', () => {
      expect(Duration.fromHMS(0, 32, 10).toCountdown()).toEqual('32m10s');
    });
    it('should display minutes on one digit on when < 10m', () => {
      expect(Duration.fromHMS(0, 3, 10).toCountdown()).toEqual('3m10s');
    });
    it('should display minutes on when < an hour, and seconds always on 2 digits', () => {
      expect(Duration.fromHMS(0, 32, 0).toCountdown()).toEqual('32m00s');
    });
    it('should display seconds when < a minute', () => {
      expect(Duration.fromHMS(0, 0, 58.29).toCountdown()).toEqual('58s');
    });
    it('should display seconds on a single digit when there are one seconds and <10', () => {
      expect(Duration.fromHMS(0, 0, 8).toCountdown()).toEqual('8s');
    });
    it('should display seconds when at 0', () => {
      expect(Duration.fromHMS(0, 0, 0).toCountdown()).toEqual('0s');
    });
  });

  describe('add', () => {
    it('should add ms when positive', () => {
      expect(Duration.fromHMS(50, 30, 10).add(3500).getHMS()).toEqual([ '50', '30', '13']);
    });
    it('should substract ms when negative', () => {
      expect(Duration.fromHMS(50, 30, 10).add(-3500).getHMS()).toEqual([ '50', '30', '6']);
    });

  });

  describe('isStrictlyPositive', () => {
    it('should return true when positive', () => {
      expect(Duration.fromSeconds(10).isStrictlyPositive()).toBeTrue();
    });
    it('should return false when negative', () => {
      expect(Duration.fromSeconds(-10).isStrictlyPositive()).toBeFalse();
    });
    it('should return false when 0', () => {
      expect(Duration.fromSeconds(0).isStrictlyPositive()).toBeFalse();
    });
  });
});
