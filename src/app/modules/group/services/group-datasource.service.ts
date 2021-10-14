import { Injectable, OnDestroy } from '@angular/core';
import { forkJoin, ReplaySubject, Subject } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { GroupRoute } from 'src/app/shared/routing/group-route';
import { GetGroupBreadcrumbsService, GroupBreadcrumb } from '../http-services/get-group-breadcrumbs.service';
import { GetGroupByIdService, Group } from '../http-services/get-group-by-id.service';

export interface GroupData {
  route: GroupRoute,
  group: Group,
  breadcrumbs: GroupBreadcrumb[],
}

/**
 * A datasource which allows fetching a group using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class GroupDataSource implements OnDestroy {

  private fetchOperation = new ReplaySubject<GroupRoute>(1); // trigger item fetching
  private refresh$ = new Subject<void>();

  state$ = this.fetchOperation.pipe(
    // switchMap does cancel the previous ongoing processing if a new one comes
    // on new fetch operation to be done: set "fetching" state and fetch the data which will result in a ready or error state
    switchMap(route => forkJoin({
      group: this.getGroupByIdService.get(route.id),
      breadcrumbs: this.getGroupBreadcrumbsService.getBreadcrumbs(route),
    }).pipe(
      map(({ group, breadcrumbs }) => ({ route, group, breadcrumbs })),
      mapToFetchState({ resetter: this.refresh$ }),
    )),
    shareReplay(1),
  );

  constructor(
    private getGroupByIdService: GetGroupByIdService,
    private getGroupBreadcrumbsService: GetGroupBreadcrumbsService,
  ) {}

  fetchGroup(route: GroupRoute): void {
    this.fetchOperation.next(route);
  }

  // If (and only if) a group is currently fetched (so we are not currently loading or in error), refetch it.
  refetchGroup(): void {
    this.refresh$.next();
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.fetchOperation.complete();
  }

}
