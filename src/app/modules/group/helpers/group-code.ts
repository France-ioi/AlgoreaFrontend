import { Duration } from 'src/app/shared/helpers/duration';
import * as D from 'io-ts/Decoder';

export const groupCodeDecoder = D.partial({
  code: D.nullable(D.string),
  codeLifetime: D.nullable(D.string),
  codeExpiresAt: D.nullable(D.string),
});

type CodeInfo = D.TypeOf<typeof groupCodeDecoder>;

export interface CodeAdditions {
  codeExpiration?: Date;
  codeLifetimeParsed?: Duration; // FIXME "Parsed" suffix is just there as there is a conflict. Should be fixed by parsing duration directly
  hasCodeNotSet: boolean;
  hasCodeUnused: boolean;
  hasCodeInUse: boolean;
  hasCodeExpired: boolean;
  codeFirstUseDate?: Date;
  durationSinceFirstCodeUse?: Duration;
  durationBeforeCodeExpiration?: Duration;
}

// Adds to the given group some new computed attributes (as value)
// The resulting object can be used in templates as value will not be recomputed
export function withCodeAdditions<T extends CodeInfo>(g: T): T & CodeAdditions {
  return {
    ...g,
    codeExpiration: codeExpiration(g),
    codeLifetimeParsed: codeLifetime(g),
    hasCodeNotSet: hasCodeNotSet(g),
    hasCodeUnused: hasCodeUnused(g),
    hasCodeInUse: hasCodeInUse(g),
    hasCodeExpired: hasCodeExpired(g),
    codeFirstUseDate: codeFirstUseDate(g),
    durationSinceFirstCodeUse: durationSinceFirstCodeUse(g),
    durationBeforeCodeExpiration: durationBeforeCodeExpiration(g),
  };
}

export function codeExpiration(group: CodeInfo): Date|undefined {
  return group.codeExpiresAt ? new Date(group.codeExpiresAt) : undefined;
}

export function codeLifetime(group: CodeInfo): Duration|undefined {
  const lifetime = group.codeLifetime;
  if (!lifetime) return undefined;
  const duration = Duration.fromString(lifetime);
  return duration.isValid() ? duration : undefined;
}

export function hasCodeNotSet(group: CodeInfo): boolean {
  return !group.code;
}

export function hasCodeUnused(group: CodeInfo): boolean {
  return !!group.code && !group.codeExpiresAt;
}

export function hasCodeInUse(group: CodeInfo): boolean {
  const expiration = codeExpiration(group);
  return !!expiration && new Date() < expiration;
}

export function hasCodeExpired(group: CodeInfo): boolean {
  const expiration = codeExpiration(group);
  return !!expiration && expiration < new Date();
}

export function codeFirstUseDate(group: CodeInfo): Date|undefined {
  const expiration = codeExpiration(group);
  const lifetime = codeLifetime(group);
  if (!expiration || !lifetime) return undefined;
  return new Date(expiration.valueOf() - lifetime.ms);
}

export function durationSinceFirstCodeUse(group: CodeInfo): Duration|undefined {
  const firstUse = codeFirstUseDate(group);
  if (!firstUse) return undefined;
  return new Duration(Date.now() - firstUse.valueOf());
}

export function durationBeforeCodeExpiration(group: CodeInfo): Duration|undefined {
  const expiration = codeExpiration(group);
  if (!expiration) return undefined;
  return new Duration(expiration.valueOf() - Date.now());
}
