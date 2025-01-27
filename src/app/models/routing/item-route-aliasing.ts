import { appConfig } from 'src/app/utils/config';
import { ItemId } from '../ids';
import { arraysEqual } from 'src/app/utils/array';

/**
 * Whether this path segment looks like an alias
 */
export function isAnItemAlias(idOrAlias: string): boolean {
  return !(/^\d*$/.test(idOrAlias));
}

/**
 * Iterate all alias to map to an id. Could be optimized with a cache for better performance.
 */
export function resolveItemAlias(alias: string): { id: ItemId, path?: string[] } | null {
  const redirects = appConfig.redirects;
  if (!redirects) return null;
  for (const [ k, v ] of Object.entries(redirects)) {
    if (pathToAlias(k) === alias) return v;
  }
  return null;
}

/**
 * Search (in config) for an alias for the given item id and its path.
 * If found, return the alias and whether the alias has a path.
 */
export function itemAliasFor(itemId: ItemId, path: string[]|undefined): { alias: string, hasPath: boolean} | null {
  const redirects = appConfig.redirects;
  if (!redirects) return null;
  for (const [ alias, v ] of Object.entries(redirects)) {
    if (v.id === itemId && (!v.path || (!!path && arraysEqual(path, v.path)))) return { alias: pathToAlias(alias), hasPath: !!v.path };
  }
  return null;
}

function pathToAlias(path: string): string {
  return path.replace(/\//g, '--');
}
