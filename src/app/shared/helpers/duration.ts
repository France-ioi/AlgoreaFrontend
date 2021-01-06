
export const SECONDS = 1000;
export const MINUTES = 60 * SECONDS;
export const HOURS = 60 * MINUTES;
export const DAYS = 24 * HOURS;
export const MONTHS = 30 * DAYS;
export const YEARS = 12 * MONTHS;

export class Duration {

  ms: number; // in milliseconds

  constructor(milliseconds: number) {
    this.ms = milliseconds;
  }

  // Create a duration from a ^\d{1,3}:[0-5]?\d:[0-5]?\d$ formatted string, e.g. "838:59:59"
  // If invalid format, return null
  static fromString(s: string): Duration|null {
    const MAX_DURATION = 838*HOURS + 59*MINUTES + 59*SECONDS; // 838:59:59 in ms
    const values = s.split(':');
    if (values.length != 3) return null;
    const sec = +values[2];
    const min = +values[1];
    const hou = +values[0];
    if (isNaN(sec) || isNaN(min) || isNaN(hou) || hou > MAX_DURATION) return null;
    return this.fromHMS(hou, min, sec) ;
  }

  static fromHMS(hours: number, minutes: number, seconds: number): Duration {
    return new Duration(hours*HOURS + minutes*MINUTES + seconds*SECONDS);
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds * SECONDS);
  }

  toString(): string {
    return `${Math.floor(this.ms/HOURS)}:${Math.floor(this.ms%HOURS/MINUTES)}:${this.ms%MINUTES}`;
  }

  toReadable(): string {
    if (this.ms < SECONDS) {
      return `${Math.max(0, Math.floor(this.ms))} ms`;
    } else if (this.ms < MINUTES) {
      return `${Math.floor(this.ms / SECONDS)} s`;
    } else if (this.ms < HOURS) {
      return `${Math.floor(this.ms / MINUTES)} min`;
    } else if (this.ms < DAYS) {
      return `${Math.floor(this.ms / HOURS)} hours`;
    } else if (this.ms < MONTHS) {
      return `${Math.floor(this.ms / DAYS)} days`;
    } else if (this.ms < YEARS) {
      return `${Math.floor(this.ms / MONTHS)} months`;
    } else {
      return `${Math.floor(this.ms / YEARS)} years`;
    }
  }

  minutes(): number {
    return Math.floor(this.ms/MINUTES);
  }

}
