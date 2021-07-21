import { Injectable, OnDestroy } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { share, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { GetGroupByIdService } from '../http-services/get-group-by-id.service';

type GroupId = string;

/**
 * A datasource which allows fetching a group using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class GroupDataSource implements OnDestroy {

  private fetchOperation = new ReplaySubject<GroupId>(1); // trigger item fetching
  private refresh$ = new Subject<void>();

  state$ = this.fetchOperation.pipe(
    // switchMap does cancel the previous ongoing processing if a new one comes
    // on new fetch operation to be done: set "fetching" state and fetch the data which will result in a ready or error state
    switchMap(id => this.getGroupByIdService.get(id)),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  constructor(
    private getGroupByIdService: GetGroupByIdService,
  ) {}

  fetchGroup(id: GroupId): void {
    this.fetchOperation.next(id);
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
