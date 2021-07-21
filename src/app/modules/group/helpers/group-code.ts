import { Duration } from 'src/app/shared/helpers/duration';
import * as D from 'io-ts/Decoder';

export const groupCodeDecoder = D.partial({
  code: D.nullable(D.string),
  codeLifetime: D.nullable(D.union(D.string, D.literal(0))),
  codeExpiresAt: D.nullable(D.string),
});

type CodeInfo = D.TypeOf<typeof groupCodeDecoder>;

export interface CodeAdditions {
  codeExpiration?: Date;
  codeLifetime?: CodeLifetime;
  hasCodeNotSet: boolean;
  hasCodeUnused: boolean;
  hasCodeInUse: boolean;
  hasCodeExpired: boolean;
  codeFirstUseDate?: Date;
  durationSinceFirstCodeUse?: Duration;
  durationBeforeCodeExpiration?: Duration;
}
export type CodeLifetime = Duration | 0 | null;

export function codeAdditions(g: CodeInfo): CodeAdditions {
  return {
    codeExpiration: codeExpiration(g),
    codeLifetime: codeLifetime(g),
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

export function codeLifetime(group: CodeInfo): CodeLifetime | undefined {
  const lifetime = group.codeLifetime;
  if (typeof lifetime !== 'string') return lifetime;
  const duration = Duration.fromString(lifetime);
  return duration.isValid() ? duration : undefined;
}

export function isSameCodeLifetime(a: CodeLifetime | undefined, b: CodeLifetime | undefined): boolean {
  if (a instanceof Duration && b instanceof Duration) return a.toString() === b.toString();
  return a === b;
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
  if (!expiration || !(lifetime instanceof Duration)) return undefined;
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
