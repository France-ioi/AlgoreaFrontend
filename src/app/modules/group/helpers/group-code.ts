import { Duration } from 'src/app/shared/helpers/duration';
import * as D from 'io-ts/Decoder';
import { durationFromSecondsDecoder } from 'src/app/shared/helpers/decoders';

export const groupCodeDecoder = D.partial({
  code: D.nullable(D.string),
  codeLifetime: D.nullable(durationFromSecondsDecoder),
  codeExpiresAt: D.nullable(D.string),
});

type CodeInfo = D.TypeOf<typeof groupCodeDecoder>;

export interface CodeAdditions {
  codeExpiration?: Date;
  hasCodeNotSet: boolean;
  hasCodeUnused: boolean;
  hasUnexpiringCode: boolean;
  hasCodeInUse: boolean;
  hasCodeExpired: boolean;
  codeFirstUseDate?: Date;
  durationSinceFirstCodeUse?: Duration;
  durationBeforeCodeExpiration?: Duration;
}
export type CodeLifetime = Duration | null;

export function codeAdditions(g: CodeInfo): CodeAdditions {
  return {
    codeExpiration: codeExpiration(g),
    hasCodeNotSet: hasCodeNotSet(g),
    hasCodeUnused: hasCodeUnused(g),
    hasUnexpiringCode: hasUnexpiringCode(g),
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

export function isSameCodeLifetime(a: CodeLifetime | undefined, b: CodeLifetime | undefined): boolean {
  if (a && b) return a.ms === b.ms;
  return a === b;
}

export function hasCodeNotSet(group: CodeInfo): boolean {
  return !group.code;
}

export function hasCodeUnused(group: CodeInfo): boolean {
  return !!group.code && group.codeLifetime !== null && !group.codeExpiresAt;
}
export function hasUnexpiringCode(group: CodeInfo): boolean {
  return !!group.code && group.codeLifetime === null;
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
  if (!expiration || !(group.codeLifetime instanceof Duration)) return undefined;
  return new Date(expiration.valueOf() - group.codeLifetime.ms);
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
