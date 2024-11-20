import { GroupRoute, groupRoute, RawGroupRoute, rawGroupRoute } from 'src/app/models/routing/group-route';
import { GetGroupPathService } from '../data-access/get-group-path.service';
import { catchError, delay, EMPTY, Observable, switchMap } from 'rxjs';
import { GroupRouter } from 'src/app/models/routing/group-router';

export interface GroupRouteError {
  tag: 'error',
  id: string,
}

export function groupRouteFromParams(id: string|null, path: string[]|null, isUser: boolean): RawGroupRoute | GroupRoute | GroupRouteError {
  if (id === null) throw new Error('Unexpected missing id from group param');
  if (path === null && !isUser) return { tag: 'error', id };
  return path === null ? rawGroupRoute({ id, isUser }) : groupRoute({ id, isUser }, path);
}

export function isGroupRouteError(route: ReturnType<typeof groupRouteFromParams>): route is GroupRouteError {
  return 'tag' in route && route.tag === 'error';
}

export function solveMissingGroupPath(groupId: string, groupPathService: GetGroupPathService, router: GroupRouter): Observable<never> {
  return groupPathService.getGroupPath(groupId).pipe(
    delay(0),
    switchMap(path => {
      router.navigateTo(groupRoute({ id: groupId, isUser: false }, path), { navExtras: { replaceUrl: true } });
      return EMPTY;
    }),
    catchError(() => {
      router.navigateTo(groupRoute({ id: groupId, isUser: false }, []), { navExtras: { replaceUrl: true } });
      return EMPTY;
    })
  );
}
