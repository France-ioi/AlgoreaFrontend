
function snakeToCamel(s: string): string {
  return s.replace(/([-_][a-z])/ig, $1 => $1.toUpperCase().replace('-', '').replace('_', ''));
}

function isObject(o: unknown): boolean {
  return o === Object(o) && !Array.isArray(o) && typeof o !== 'function';
}

/**
 * Convert data from snake_case keys to camelCase
 */
export function snakeToCamelKeys(input: unknown): unknown {
  if (isObject(input)) {
    const n: { [key: string]: unknown } = {};
    const o = input as { [key: string]: unknown };
    Object.keys(o).forEach(k => {
      n[snakeToCamel(k)] = snakeToCamelKeys(o[k]);
    });
    return n;

  } else if (Array.isArray(input)) {
    return input.map(el => snakeToCamelKeys(el));
  }

  return input;
}

export function capitalize(text: string): string {
  return text.substring(0, 1).toUpperCase() + text.substring(1);
}
