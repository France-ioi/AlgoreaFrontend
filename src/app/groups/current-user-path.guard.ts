import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { UserSessionService } from 'src/app/services/user-session.service';

/**
 * `/groups/users/me` is a fixed URL for the login-module. It is not a group id:
 * a temporary session starts login, and a signed-in user is sent to their group id.
 */
export const currentUserPathGuard: CanActivateFn = (_route, state) => {
  const userSession = inject(UserSessionService);
  const router = inject(Router);

  return userSession.userProfile$.pipe(
    take(1),
    map(profile => {
      if (profile.tempUser) {
        userSession.login();
        return false;
      }
      return new RedirectCommand(urlWithGroupId(router, state, profile.groupId), { replaceUrl: true });
    }),
  );
};

function urlWithGroupId(router: Router, state: RouterStateSnapshot, groupId: string): UrlTree {
  const current = router.parseUrl(state.url);
  const primary = current.root.children['primary'];
  const paths = primary ? primary.segments.map(segment => segment.path) : [];
  const usersIndex = paths.indexOf('users');
  if (usersIndex >= 0 && paths[usersIndex + 1] === 'me') paths[usersIndex + 1] = groupId;
  return router.createUrlTree(paths, {
    queryParams: current.queryParams,
    fragment: current.fragment ?? undefined,
  });
}
