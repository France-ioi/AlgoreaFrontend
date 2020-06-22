
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

export class Duration {

  ms: number; // in milliseconds

  constructor(milliseconds: number) {
    this.ms = milliseconds;
  };

  // Create a duration from a ^\d{1,3}:[0-5]?\d:[0-5]?\d$ formatted string, e.g. "838:59:59"
  // If invalid format, return null
  static fromString(s: string): Duration|null {
    const MAX_DURATION = 838*HOURS + 59*MINUTES + 59*SECONDS; // 838:59:59 in ms
    let values = s.split(':');
    if (values.length != 3) return null;
    let sec = +values[2];
    let min = +values[1];
    let hou = +values[0];
    if (sec === NaN || min === NaN || hou === NaN || hou > MAX_DURATION) return null;
    return this.fromHMS(hou, min, sec) ;
  };

  static fromHMS(hours: number, minutes: number, seconds: number): Duration {
    return new this(hours*HOURS + minutes*MINUTES + seconds*SECONDS);
  };

  toString(): string {
    return Math.floor(this.ms/HOURS) + ':' + Math.floor(this.ms%HOURS/MINUTES) + ':' + this.ms%MINUTES;
  };

  minutes(): number {
    return Math.floor(this.ms/MINUTES);
  }

}
