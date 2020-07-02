import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from 'src/app/shared/helpers/duration';
import {
  GroupWithCodeInfo,
  hasCodeNotSet,
  hasCodeUnused,
  hasCodeInUse,
  hasCodeExpired,
  durationSinceFirstCodeUse,
  durationBeforeCodeExpiration,
  codeLifetime,
} from '../helpers/group-code';

@Pipe({ name: 'codeLifetime' })
export class CodeLifetimePipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): Duration|null {
    return codeLifetime(group);
  }
}

@Pipe({ name: 'hasCodeNotSet' })
export class CodeNotSetPipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): boolean {
    return hasCodeNotSet(group);
  }
}

@Pipe({ name: 'hasCodeUnused' })
export class CodeUnusedPipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): boolean {
    return hasCodeUnused(group);
  }
}

@Pipe({ name: 'hasCodeInUse' })
export class CodeInUsePipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): boolean {
    return hasCodeInUse(group);
  }
}

@Pipe({ name: 'hasCodeExpired' })
export class CodeExpiredPipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): boolean {
    return hasCodeExpired(group);
  }
}

@Pipe({ name: 'durationSinceFirstCodeUse' })
export class DurationSinceFirstCodeUsePipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): Duration|null {
    return durationSinceFirstCodeUse(group);
  }
}

@Pipe({ name: 'durationBeforeCodeExpiration' })
export class DurationBeforeCodeExpirationPipe implements PipeTransform {
  transform(group: GroupWithCodeInfo): Duration|null {
    return durationBeforeCodeExpiration(group);
  }
}

