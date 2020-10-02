import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, concat, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { errorState, FetchError, Fetching, fetchingState, isReady, Ready, readyState } from 'src/app/shared/helpers/state';
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

  private state = new BehaviorSubject<Ready<Group>|Fetching|FetchError>(fetchingState());
  state$ = this.state.asObservable();
  group$ = this.state.pipe( // only fetched groups, to be use in template as it cannot properly infer types
    filter<Ready<Group>|Fetching|FetchError, Ready<Group>>(isReady),
    map(s => s.data)
  )

  private fetchOperation = new Subject<GroupId>(); // trigger item fetching

  constructor(
    private getGroupByIdService: GetGroupByIdService,
  ) {
    this.fetchOperation.pipe(
      // switchMap does cancel the previous ongoing processing if a new one comes
      switchMap(id => {
        const dataFetch = this.getGroupByIdService.get(id).pipe(
          map(res => readyState(res)),
          catchError(e => of(errorState(e)))
        );

        // if the fetched group is the same as the current one, do not change state to "loading" (silent refresh)
        const currentState = this.state.value;
        if (isReady(currentState) && currentState.data.id === id) return dataFetch;
        else return concat(of(fetchingState()), dataFetch);
      })
    ).subscribe(state => this.state.next(state));
  }

  fetchGroup(id: GroupId) {
    this.fetchOperation.next(id);
  }

  // If (and only if) a group is currently fetched (so we are not currently loading or in error), refetch it.
  refetchGroup() {
    if (isReady(this.state.value)) {
      this.fetchOperation.next(this.state.value.data.id);
    }
  }

  ngOnDestroy() {
    this.state.complete();
    this.fetchOperation.complete();
  }

}
