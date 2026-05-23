
function snakeToCamel(s: string): string {
  return s.replace(/([-_][a-z])/ig, $1 => $1.toUpperCase().replace('-', '').replace('_', ''));
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (letter, index) => (index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`));
}

function isObject(o: unknown): boolean {
  return o === Object(o) && !Array.isArray(o) && typeof o !== 'function';
}

type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
    : `${Lowercase<Head>}_${CamelToSnakeCase<Uncapitalize<Tail>>}`
  : S;

type SnakeToCamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${SnakeToCamelCase<Capitalize<Tail>>}`
  : S;

type CamelCaseKeysDeep<T> = T extends readonly (infer U)[]
  ? CamelCaseKeysDeep<U>[]
  : T extends Record<string, unknown>
    ? {
        [K in keyof T as SnakeToCamelCase<K & string>]: CamelCaseKeysDeep<T[K]>;
      }
    : T;

/** Map object keys from camelCase to snake_case at the type level (one level deep). */
export type SnakeCaseKeys<T extends Record<string, unknown>> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K];
};

type SnakeCaseKeysDeep<T> = T extends readonly (infer U)[]
  ? SnakeCaseKeysDeep<U>[]
  : T extends Record<string, unknown>
    ? {
        [K in keyof T as CamelToSnakeCase<K & string>]: SnakeCaseKeysDeep<T[K]>;
      }
    : T;

/**
 * Convert data from snake_case keys to camelCase
 */
export function snakeToCamelKeys<T>(input: T): CamelCaseKeysDeep<T> {
  if (isObject(input)) {
    const n: Record<string, unknown> = {};
    const o = input as Record<string, unknown>;
    Object.keys(o).forEach(k => {
      n[snakeToCamel(k)] = snakeToCamelKeys(o[k]);
    });
    return n as CamelCaseKeysDeep<T>;

  } else if (Array.isArray(input)) {
    const mapped = (input as unknown[]).map(el => snakeToCamelKeys(el));
    return mapped as CamelCaseKeysDeep<T>;
  }

  return input as CamelCaseKeysDeep<T>;
}

/**
 * Convert data from camelCase keys to snake_case.
 *
 * Only supports plain JSON-style values: objects (plain property bags), arrays,
 * and primitives. Class instances, Date, Map, Set, and similar types are not
 * handled correctly (e.g. a Date is treated as an empty object).
 */
export function camelToSnakeKeys<T>(input: T): SnakeCaseKeysDeep<T> {
  if (isObject(input)) {
    const n: Record<string, unknown> = {};
    const o = input as Record<string, unknown>;
    Object.keys(o).forEach(k => {
      n[camelToSnake(k)] = camelToSnakeKeys(o[k]);
    });
    return n as SnakeCaseKeysDeep<T>;

  } else if (Array.isArray(input)) {
    const mapped = (input as unknown[]).map(el => camelToSnakeKeys(el));
    return mapped as SnakeCaseKeysDeep<T>;
  }

  return input as SnakeCaseKeysDeep<T>;
}

export function capitalize(text: string): string {
  return text.substring(0, 1).toUpperCase() + text.substring(1);
}
