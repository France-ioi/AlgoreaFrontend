
export const SECONDS = 1000;
export const MINUTES = 60 * SECONDS;
export const HOURS = 60 * MINUTES;
export const DAYS = 24 * HOURS;
export const MONTHS = 30 * DAYS;
export const YEARS = 365 * DAYS;
export const MAX_TIME_FORMAT_DURATION = 838*HOURS + 59*MINUTES + 59*SECONDS;
export const MAX_SECONDS_FORMAT_DURATION = 2147483647 * SECONDS;

export class Duration {

  ms: number; // in milliseconds

  constructor(milliseconds: number) {
    this.ms = milliseconds;
  }

  // Create a duration from a ^\d{1,3}:[0-5]?\d:[0-5]?\d$ formatted string, e.g. "838:59:59"
  static fromString(s: string): Duration {
    const [ hr, min, sec ] = s.split(':');
    return this.fromHMS(Number(hr), Number(min), Number(sec));
  }

  static fromHMS(hours: number, minutes: number, seconds: number): Duration {
    return new Duration(hours*HOURS + minutes*MINUTES + seconds*SECONDS);
  }

  static fromDHM(days: number, hours: number, minutes: number): Duration {
    return new Duration(days*DAYS + hours*HOURS + minutes*MINUTES);
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds * SECONDS);
  }

  toString(): string {
    return `${Math.floor(this.ms/HOURS)}:${Math.floor(this.ms%HOURS/MINUTES)}:${this.ms%MINUTES/SECONDS}`;
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

  getMs(): number {
    return this.ms;
  }

  minutes(): number {
    return Math.floor(this.ms/MINUTES);
  }

  seconds(): number {
    return Math.floor(this.ms/SECONDS);
  }

  getHMS(): [string, string, string] {
    return [
      Math.floor(this.ms/HOURS).toString(),
      Math.floor(this.ms%HOURS/MINUTES).toString(),
      Math.floor(this.ms%MINUTES/SECONDS).toString()
    ];
  }

  getDHM(): [string, string, string] {
    return [
      Math.floor(this.ms/DAYS).toString(),
      Math.floor(this.ms%DAYS/HOURS).toString(),
      Math.floor(this.ms%HOURS/MINUTES).toString(),
    ];
  }

  isValid(): boolean {
    return !isNaN(this.ms);
  }

}
