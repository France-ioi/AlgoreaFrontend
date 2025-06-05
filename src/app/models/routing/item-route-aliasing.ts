import { ItemId } from '../ids';
import { arraysEqual } from 'src/app/utils/array';

interface AliasTarget {
  id: ItemId,
  path?: string[],
}
export type Aliases = Record<string, AliasTarget>;

/**
 * Whether this path segment looks like an alias
 */
export function isAnItemAlias(idOrAlias: string): boolean {
  return !(/^\d*$/.test(idOrAlias));
}

/**
 * Iterate all alias to map to an id. Could be optimized with a cache for better performance.
 */
export function resolveItemAlias(alias: string, aliases: Aliases): AliasTarget | null {
  for (const [ k, v ] of Object.entries(aliases)) {
    if (pathToAlias(k) === alias) return v;
  }
  return null;
}

/**
 * Search (in config) for an alias for the given item id and its path.
 * If found, return the alias and whether the alias has a path.
 */
export function itemAliasFor(itemId: ItemId, path: string[] | undefined, aliases: Aliases): { alias: string, hasPath: boolean} | null {
  for (const [ aliasPath, v ] of Object.entries(aliases)) {
    if (v.id === itemId && (!v.path || (!!path && arraysEqual(path, v.path)))) {
      return { alias: pathToAlias(aliasPath), hasPath: !!v.path };
    }
  }
  return null;
}

function pathToAlias(path: string): string {
  return path.replace(/\//g, '--');
}
