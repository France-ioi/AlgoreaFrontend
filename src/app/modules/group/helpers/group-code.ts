import { Duration } from 'src/app/shared/helpers/duration';

export interface CodeInfo {
  code?: string;
  code_lifetime?: string;
  code_expires_at?: string;
}

export interface CodeAdditions {
  codeExpiration?: Date;
  codeLifetime?: Duration;
  hasCodeNotSet: boolean;
  hasCodeUnused: boolean;
  hasCodeInUse: boolean;
  hasCodeExpired: boolean;
  codeFirstUseDate: Date|null;
  durationSinceFirstCodeUse: Duration|null;
  durationBeforeCodeExpiration: Duration|null;
}

// Adds to the given group some new computed attributes (as value)
// The resulting object can be used in templates as value will not be recomputed
export function withCodeAdditions<T extends CodeInfo>(g: T): T & CodeAdditions {
  return Object.assign({}, g, {
    codeExpiration: codeExpiration(g),
    codeLifetime: codeLifetime(g),
    hasCodeNotSet: hasCodeNotSet(g),
    hasCodeUnused: hasCodeUnused(g),
    hasCodeInUse: hasCodeInUse(g),
    hasCodeExpired: hasCodeExpired(g),
    codeFirstUseDate: codeFirstUseDate(g),
    durationSinceFirstCodeUse: durationSinceFirstCodeUse(g),
    durationBeforeCodeExpiration: durationBeforeCodeExpiration(g),
  });
}

export function codeExpiration(group: CodeInfo): Date|undefined {
  return group.code_expires_at ? new Date(group.code_expires_at) : undefined;
}

export function codeLifetime(group: CodeInfo): Duration|undefined {
  if (!group.code_lifetime) {
    return undefined;
  }
  return  Duration.fromString(group.code_lifetime);
}

export function hasCodeNotSet(group: CodeInfo): boolean {
  return !group.code;
}

export function hasCodeUnused(group: CodeInfo): boolean {
  return group.code && !group.code_expires_at;
}

export function hasCodeInUse(group: CodeInfo): boolean {
  return group.code_expires_at && new Date() < codeExpiration(group);
}

export function hasCodeExpired(group: CodeInfo): boolean {
  return group.code_expires_at && codeExpiration(group) < new Date();
}

export function codeFirstUseDate(group: CodeInfo): Date|null {
  if (!group.code_expires_at || !group.code_lifetime) return null;
  return new Date(codeExpiration(group).valueOf() - codeLifetime(group).ms);
}

export function durationSinceFirstCodeUse(group: CodeInfo): Duration|null {
  const firstUse = codeFirstUseDate(group);
  if (firstUse == null) return null;
  return new Duration(Date.now() - firstUse.valueOf());
}

export function durationBeforeCodeExpiration(group: CodeInfo): Duration|null {
  const expiration = codeExpiration(group);
  if (!expiration) return null;
  return new Duration(expiration.valueOf() - Date.now());
}
