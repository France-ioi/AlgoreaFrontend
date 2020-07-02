import { Duration } from 'src/app/shared/helpers/duration';

export interface GroupWithCodeInfo {
  code?: string;
  code_lifetime?: string;
  code_expires_at?: string;
}

export function codeExpiration(group: GroupWithCodeInfo): Date|undefined {
  return group.code_expires_at ? new Date(group.code_expires_at) : undefined;
}

export function codeLifetime(group: GroupWithCodeInfo): Duration|undefined {
  if (!group.code_lifetime) {
    return undefined;
  }
  return  Duration.fromString(group.code_lifetime);
}

export function hasCodeNotSet(group: GroupWithCodeInfo): boolean {
  return !group.code;
}

export function hasCodeUnused(group: GroupWithCodeInfo): boolean {
  return group.code && !group.code_expires_at;
}

export function hasCodeInUse(group: GroupWithCodeInfo): boolean {
  return group.code_expires_at && new Date() < codeExpiration(group);
}

export function hasCodeExpired(group: GroupWithCodeInfo): boolean {
  return group.code_expires_at && codeExpiration(group) < new Date();
}

export function codeFirstUseDate(group: GroupWithCodeInfo): Date|null {
  if (!group.code_expires_at || !group.code_lifetime) return null;
  return new Date(codeExpiration(group).valueOf() - codeLifetime(group).ms);
}

export function durationSinceFirstCodeUse(group: GroupWithCodeInfo): Duration|null {
  const firstUse = codeFirstUseDate(group);
  if (firstUse == null) return null;
  return new Duration(Date.now() - firstUse.valueOf());
}

export function durationBeforeCodeExpiration(group: GroupWithCodeInfo): Duration|null {
  const expiration = codeExpiration(group);
  if (!expiration) return null;
  return new Duration(expiration.valueOf() - Date.now());
}
