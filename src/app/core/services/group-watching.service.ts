import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { GetGroupByIdService, Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { GetUserService, User } from 'src/app/modules/group/http-services/get-user.service';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { boolToQueryParamValue, queryParamValueToBool } from 'src/app/shared/helpers/url';
import { rawGroupRoute, RawGroupRoute } from 'src/app/shared/routing/group-route';

const watchedGroupQueryParam = 'watchedGroupId';
const watchedGroupIsUserQueryParam = 'watchUser';
const noWatchingValue = 'none'; // value of `watchedGroupQueryParam` which means that there is no watching

export interface WatchedGroup {
  route: RawGroupRoute,
  name: string,
  currentUserCanGrantGroupAccess?: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GroupWatchingService implements OnDestroy {

  // to allow giving the group info when enabling "group watching" manually (without having to refetch it), and prevent refetching the same
  // group when the query parameter is given while the observation is already enabled on the same group
  private cachedGroupInfo = new BehaviorSubject<WatchedGroup|undefined>(undefined);

  private watchedGroupParams = this.route.queryParamMap.pipe(
    map(params => {
      const groupId = params.get(watchedGroupQueryParam);
      const isUser = queryParamValueToBool(params.get(watchedGroupIsUserQueryParam));
      if (groupId === noWatchingValue) return null; // `noWatchingValue` => forced 'not watching'
      if (!groupId) return undefined; // missing/empty parameter => unchanged from previous value
      return { groupId, isUser };
    }),
    filter(isNotUndefined), // if "unchanged from previous value", ignore (prevent issues with Angular auto-removing query params)
    startWith(null), // the default is no watching
    distinctUntilChanged((prev,cur) => prev?.groupId === cur?.groupId && prev?.isUser === cur?.isUser),
  );

  watchedGroup$ = this.watchedGroupParams.pipe(
    withLatestFrom(this.cachedGroupInfo),
    switchMap(([ watchedGroupParams, cachedGroup ]) => {
      if (watchedGroupParams === null) return of(null);
      if (cachedGroup && watchedGroupParams.groupId === cachedGroup.route.id) return of(cachedGroup);
      return watchedGroupParams.isUser ? this.fetchUser(watchedGroupParams.groupId) : this.fetchGroup(watchedGroupParams.groupId);
    }),
    shareReplay(1),
  );
  isWatching$ = this.watchedGroup$.pipe(
    map(g => g !== null)
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GetGroupByIdService,
    private userService: GetUserService,
  ) {}

  ngOnDestroy(): void {
    this.cachedGroupInfo.complete();
  }

  startUserWatching(user: User): void {
    this.cachedGroupInfo.next({ route: rawGroupRoute(user), name: user.login });
    this.setWatchedGroupInUrlParams({ groupId: user.groupId, isUser: true });
  }

  startGroupWatching(group: Group): void {
    this.cachedGroupInfo.next({
      route: rawGroupRoute(group),
      name: group.name,
      currentUserCanGrantGroupAccess: group.currentUserCanGrantGroupAccess
    });
    this.setWatchedGroupInUrlParams({ groupId: group.id, isUser: false });
  }

  stopWatching(): void {
    this.setWatchedGroupInUrlParams(null);
  }

  /**
   * Add the watched group in the url params. If `null` is given, set it to disable watching.
   */
  private setWatchedGroupInUrlParams(wg: { groupId: string, isUser: boolean }|null): void {
    const params: Params = {};
    params[watchedGroupQueryParam] = wg?.groupId ?? noWatchingValue;
    params[watchedGroupIsUserQueryParam] = boolToQueryParamValue(wg !== null && wg.isUser);
    void this.router.navigate(this.route.snapshot.url, { queryParams: params, queryParamsHandling: 'merge' });
  }

  private fetchUser(id: string): Observable<WatchedGroup> {
    return this.userService.getForId(id).pipe(
      map(user => ({
        route: rawGroupRoute(user),
        name: user.login,
      }))
    );
  }

  private fetchGroup(id: string): Observable<WatchedGroup> {
    return this.groupService.get(id).pipe(
      map(g => ({
        route: rawGroupRoute(g),
        name: g.name,
      }))
    );
  }

}

