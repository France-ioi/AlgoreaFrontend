import { isDefined } from './null-undefined-predicates';

export function mustNotBeUndefined<T>(value: T | undefined, message = 'expected value not to be undefined'): asserts value is T {
  if (!isDefined(value)) throw new Error(message);
}

export function ensureDefined<T>(value: T | undefined, message = 'expected value not to be undefined'): T {
  mustNotBeUndefined(value, message);
  return value;
}
