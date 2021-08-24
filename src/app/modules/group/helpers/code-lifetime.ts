import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { durationFromSecondsDecoder } from 'src/app/shared/helpers/decoders';
import { Duration } from 'src/app/shared/helpers/duration';

export class CodeLifetime extends Duration {

  static readonly infiniteValue = Infinity;
  static readonly usableOnceValue = 0;

  static fromDuration(duration: Duration | null): CodeLifetime {
    return duration === null ? new CodeLifetime(Infinity) : new CodeLifetime(duration.ms);
  }

  get infinite(): boolean {
    return this.ms === CodeLifetime.infiniteValue;
  }

  get usableOnce(): boolean {
    return this.ms === CodeLifetime.usableOnceValue;
  }

  get valueInSeconds(): number | null {
    return this.infinite ? null : this.seconds();
  }

  get duration(): Duration | undefined {
    return this.infinite ? undefined : new Duration(this.ms);
  }

}


export const codeLifetimeDecoder: D.Decoder<unknown, CodeLifetime> = pipe(
  D.nullable(durationFromSecondsDecoder),
  D.parse(duration => D.success(CodeLifetime.fromDuration(duration))),
);
