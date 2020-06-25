import { Pipe, PipeTransform } from '@angular/core';
import { Group, GroupCodeState } from './group.model';

/*
 * Return whether the group has joining code is not set
 */
@Pipe({ name: 'hasCodeNotSet' })
export class CodeNotSetPipe implements PipeTransform {
  transform(group: Group): boolean {
    return group.codeState() === GroupCodeState.NotSet;
  }
}

/*
 * Return whether the group has joining code is unused
 */
@Pipe({ name: 'hasCodeUnused' })
export class CodeUnusedPipe implements PipeTransform {
  transform(group: Group): boolean {
    return group.codeState() === GroupCodeState.Unused;
  }
}

/*
 * Return whether the group has joining code is in use (not expired)
 */
@Pipe({ name: 'hasCodeInUse' })
export class CodeInUsePipe implements PipeTransform {
  transform(group: Group): boolean {
    return group.codeState() === GroupCodeState.InUse;
  }
}

/*
 * Return whether the group has joining code is expired
 */
@Pipe({ name: 'hasCodeExpired' })
export class CodeExpiredPipe implements PipeTransform {
  transform(group: Group): boolean {
    return group.codeState() === GroupCodeState.Expired;
  }
}

/**
 * Return the number of milliseconds since the first use of the code
 */
@Pipe({ name: 'msSinceCodeFirstUsed' })
export class CodeTimeSinceFirstUsePipe implements PipeTransform {
  transform(group: Group): number {
    const t = group.codeFirstUse();
    if (t == null) return 0;
    return Date.now() - t.valueOf();
  }
}

/**
 * Return the number of milliseconds before expiration (or 0 if past or not set)
 */
@Pipe({ name: 'msBeforeExpiration' })
export class CodeTimeBeforeExpirationPipe implements PipeTransform {
  transform(group: Group): number {
    return (group.code_expires_at == null || group.code_expires_at < new Date()) ? 0 : group.code_expires_at.valueOf() - Date.now();
  }
}

