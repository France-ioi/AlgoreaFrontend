import { z } from 'zod/v4';
import { Pipe, PipeTransform } from '@angular/core';

export const entryStateValueSchema = z.enum([ 'ready', 'already_started', 'not_ready' ]);

interface EntryState {
  state: z.infer<typeof entryStateValueSchema>,
}

export function canEnterNow(entryState: EntryState): boolean {
  return entryState.state === 'ready';
}

export function hasAlreadyStated(entryState: EntryState): boolean {
  return entryState.state === 'already_started';
}


// ********************************************
// Pipes for templates
// ********************************************

@Pipe({
  name: 'canEnterNow',
  pure: true,
  standalone: true
})
export class CanEnterNowPipe implements PipeTransform {
  transform = canEnterNow;
}

@Pipe({
  name: 'hasAlreadyStated',
  pure: true,
  standalone: true
})
export class HasAlreadyStatedPipe implements PipeTransform {
  transform = hasAlreadyStated;
}
