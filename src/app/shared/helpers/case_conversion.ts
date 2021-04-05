
function toCamel(s: string): string {
  return s.replace(/([-_][a-z])/ig, $1 => $1.toUpperCase().replace('-', '').replace('_', ''));
}

function isObject(o: unknown): boolean {
  return o === Object(o) && !Array.isArray(o) && typeof o !== 'function';
}

export function keysToCamel(input: unknown): unknown {
  if (isObject(input)) {
    const n: { [key: string]: unknown } = {};
    const o = input as { [key: string]: unknown };
    Object.keys(o).forEach(k => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;

  } else if (Array.isArray(input)) {
    return input.map(el => keysToCamel(el));
  }

  return input;
}
