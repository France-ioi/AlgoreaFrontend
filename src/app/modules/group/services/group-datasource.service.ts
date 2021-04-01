import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, concat, of, Subject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { readyOnly } from 'src/app/shared/operators/state';
import { GetGroupByIdService, Group } from '../http-services/get-group-by-id.service';

type GroupId = string;

/**
 * A datasource which allows fetching a group using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class GroupDataSource implements OnDestroy {

  private state = new BehaviorSubject<FetchState<Group>>(fetchingState());
  state$ = this.state.asObservable();
  group$ = this.state.pipe( // only fetched groups, to be use in template as it cannot properly infer types
    readyOnly(),
    map(s => s.data)
  )

  private fetchOperation = new Subject<GroupId>(); // trigger item fetching

  constructor(
    private getGroupByIdService: GetGroupByIdService,
  ) {
    this.fetchOperation.pipe(

      // switchMap does cancel the previous ongoing processing if a new one comes
      // on new fetch operation to be done: set "fetching" state and fetch the data which will result in a ready or error state
      switchMap(id =>
        concat(
          of(fetchingState()),
          this.getGroupByIdService.get(id).pipe(
            map(res => readyState(res)),
            catchError(e => of(errorState(e)))
          )
        )
      ),

    ).subscribe(state => this.state.next(state));
  }

  fetchGroup(id: GroupId): void {
    this.fetchOperation.next(id);
  }

  // If (and only if) a group is currently fetched (so we are not currently loading or in error), refetch it.
  refetchGroup(): void {
    if (this.state.value.isReady) {
      this.fetchOperation.next(this.state.value.data.id);
    }
  }

  ngOnDestroy(): void {
    this.state.complete();
    this.fetchOperation.complete();
  }

}
