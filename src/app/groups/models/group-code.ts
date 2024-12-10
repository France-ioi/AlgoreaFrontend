import { Duration } from 'src/app/utils/duration';
import { z } from 'zod';
import { codeLifetimeSchema } from './code-lifetime';

export const groupCodeSchema = z.object({
  code: z.string().nullable(),
  codeLifetime: codeLifetimeSchema,
  codeExpiresAt: z.string().nullable(),
}).partial();

type GroupCode = z.infer<typeof groupCodeSchema>;

export interface CodeInfo {
  codeExpiration?: Date,
  hasCodeNotSet: boolean,
  hasCodeUnused: boolean,
  hasUnexpiringCode: boolean,
  hasCodeInUse: boolean,
  hasCodeExpired: boolean,
  codeFirstUseDate?: Date,
  durationSinceFirstCodeUse?: Duration,
  durationBeforeCodeExpiration?: Duration,
}

export function codeInfo(g: GroupCode): CodeInfo {
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

export function codeExpiration(group: GroupCode): Date|undefined {
  return group.codeExpiresAt ? new Date(group.codeExpiresAt) : undefined;
}

export function hasCodeNotSet(group: GroupCode): boolean {
  return !group.code;
}

export function hasCodeUnused(group: GroupCode): boolean {
  return !!group.code && !group.codeLifetime?.isInfinite && !group.codeExpiresAt;
}
export function hasUnexpiringCode(group: GroupCode): boolean {
  return !!group.code && !!group.codeLifetime?.isInfinite;
}

export function hasCodeInUse(group: GroupCode): boolean {
  const expiration = codeExpiration(group);
  return !!expiration && new Date() < expiration;
}

export function hasCodeExpired(group: GroupCode): boolean {
  const expiration = codeExpiration(group);
  return !!expiration && expiration < new Date();
}

export function codeFirstUseDate(group: GroupCode): Date|undefined {
  const expiration = codeExpiration(group);
  if (!expiration || !group.codeLifetime || group.codeLifetime.isInfinite) return undefined;
  return new Date(expiration.valueOf() - group.codeLifetime.ms);
}

export function durationSinceFirstCodeUse(group: GroupCode): Duration|undefined {
  const firstUse = codeFirstUseDate(group);
  if (!firstUse) return undefined;
  return new Duration(Date.now() - firstUse.valueOf());
}

export function durationBeforeCodeExpiration(group: GroupCode): Duration|undefined {
  const expiration = codeExpiration(group);
  if (!expiration) return undefined;
  return new Duration(expiration.valueOf() - Date.now());
}
