
type Id = string;

export interface ContentRoute {
  contentType: string,
  id: Id,
  path: Id[],
}

/*
 * Returns, among the given list of breadcrumbs, the one which is the closest from the base.
 * The closest path is the shortest path with the longest common prefix. (if several ones, any of these is returned)
 * `list` must not be empty, otherwise throw an exception!
 */
export function closestBreadcrumbs<T extends { id: Id }>(base: Id[], list: T[][]): T[] {
  const sol = list.map(breadcrumbs => {
    for (let i = 0; i < base.length; i++) {
      if (base[i] !== breadcrumbs[i]?.id) return { common: i, breadcrumbs };
    }
    return { common: base.length, breadcrumbs };
  }).reduce((prev, cur) => {
    if (prev.common > cur.common) return prev;
    if (cur.common > prev.common) return cur;
    return prev.breadcrumbs.length > cur.breadcrumbs.length ? cur : prev;
  });
  return sol.breadcrumbs;
}
