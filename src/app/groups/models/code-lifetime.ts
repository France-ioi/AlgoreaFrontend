import { z } from 'zod';
import { Duration } from '../../utils/duration';

export class CodeLifetime extends Duration {

  static readonly infiniteValue = Infinity;
  static readonly usableOnceValue = 0;

  get isInfinite(): boolean {
    return this.ms === CodeLifetime.infiniteValue;
  }

  get isUsableOnce(): boolean {
    return this.ms === CodeLifetime.usableOnceValue;
  }

  get valueInSeconds(): number | null {
    return this.isInfinite ? null : this.seconds();
  }

  get asDuration(): Duration | undefined {
    return this.isInfinite ? undefined : new Duration(this.ms);
  }

}

export const codeLifetimeSchema = z.number().nullable().transform<CodeLifetime>(valueInSeconds =>
  new CodeLifetime(valueInSeconds === null ? Infinity : valueInSeconds * 1000)
);
