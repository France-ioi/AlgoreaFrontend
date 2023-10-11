import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/groups/data-access/get-group-by-id.service';
import { GetUserService, User } from 'src/app/groups/data-access/get-user.service';
import { isNotUndefined } from '../utils/null-undefined-predicates';
import { boolToQueryParamValue, queryParamValueToBool } from '../utils/url';
import { GroupRoute, rawGroupRoute, RawGroupRoute } from 'src/app/models/routing/group-route';
import { formatUser } from '../models/user';

const watchedGroupQueryParam = 'watchedGroupId';
const watchedGroupIsUserQueryParam = 'watchUser';
const noWatchingValue = 'none'; // value of `watchedGroupQueryParam` which means that there is no watching

export interface WatchedGroup {
  route: RawGroupRoute,
  name: string,
  currentUserCanGrantAccess: boolean,
}

export interface StartWatchGroupInfo {
  id: string,
  name: string,
  currentUserCanGrantGroupAccess: boolean,
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

  private watchedGroupOrError$ = this.watchedGroupParams.pipe(
    withLatestFrom(this.cachedGroupInfo),
    switchMap(([ watchedGroupParams, cachedGroup ]) => {
      if (watchedGroupParams === null) return of(null);
      if (cachedGroup && watchedGroupParams.groupId === cachedGroup.route.id) return of(cachedGroup);
      return watchedGroupParams.isUser ? this.fetchUser(watchedGroupParams.groupId) : this.fetchGroup(watchedGroupParams.groupId);
    }),
    catchError(err => {
      // if the user/group does not exist, we consider we cannot watch it and thus exit watch mode.
      if (err instanceof HttpErrorResponse) return of(err);
      else throw err; // if it's a JS error, let it bubble, our error monitoring tool will catch it.
    }),
    shareReplay(1),
  );
  watchedGroup$ = this.watchedGroupOrError$.pipe(
    map((result): WatchedGroup | null => (result instanceof HttpErrorResponse ? null : result)),
    distinctUntilChanged(),
  );
  watchedGroupError$ = this.watchedGroupOrError$
    .pipe(filter((result): result is HttpErrorResponse => result instanceof HttpErrorResponse));

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

  startUserWatching(route: RawGroupRoute, user: User): void {
    this.cachedGroupInfo.next({
      route: route,
      name: formatUser(user),
      currentUserCanGrantAccess: user.currentUserCanGrantUserAccess || false,
    });
    this.setWatchedGroupInUrlParams({ groupId: user.groupId, isUser: true });
  }

  startGroupWatching(route: GroupRoute, group: StartWatchGroupInfo): void {
    this.cachedGroupInfo.next({
      route: route,
      name: group.name,
      currentUserCanGrantAccess: group.currentUserCanGrantGroupAccess,
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
        currentUserCanGrantAccess: user.currentUserCanGrantUserAccess || false,
      }))
    );
  }

  private fetchGroup(id: string): Observable<WatchedGroup> {
    return this.groupService.get(id).pipe(
      map(g => ({
        route: rawGroupRoute(g),
        name: g.name,
        currentUserCanGrantAccess: g.currentUserCanGrantGroupAccess || false,
      }))
    );
  }

}

