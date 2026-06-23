import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { GetRequestsService, PendingRequest } from '../../data-access/get-requests.service';
import { Action, parseResults, RequestActionsService } from '../../data-access/request-actions.service';
import { merge, of, Subject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { errorState, fetchingState, readyState } from 'src/app/utils/state';
import { displayResponseToast } from 'src/app/groups/containers/pending-request/pending-request-response-handling';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ensureDefined } from 'src/app/utils/assert';
import { HttpErrorResponse } from '@angular/common/http';

interface GridColumn {
  field: string,
  header: string,
  sortKey?: string,
}

const groupColumn = { field: 'group.name', header: $localize`GROUP` };

const baseColumns: GridColumn[] = [
  { field: 'user.login', header: $localize`USER` },
  { field: 'at', header: $localize`REQUESTED ON` },
];

@Component({
  selector: 'alg-pending-join-requests',
  templateUrl: './pending-join-requests.component.html',
  styleUrl: './pending-join-requests.component.scss',
})
export class PendingJoinRequestsComponent {
  private getRequestsService = inject(GetRequestsService);
  private requestActionService = inject(RequestActionsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private destroyRef = inject(DestroyRef);

  // if groupId is undefined, pending join requests from all managed group will be used.
  groupId = input<string>();
  showSwitch = input(true);

  requests = signal<PendingRequest[]>([]);

  includeSubgroup = signal(false);

  columns = computed(() => {
    if (!this.showSwitch() || this.includeSubgroup()) {
      return [ groupColumn, ...baseColumns ];
    }
    return baseColumns;
  });

  readonly subgroupSwitchItems = [
    { label: $localize`This group only`, value: false },
    { label: $localize`All subgroups`, value: true }
  ];

  state = signal<'fetching' | 'processing' | 'ready' | 'fetchingError'>('fetching');
  currentSort = signal<string[]>([]);

  private dataFetching = new Subject<{ groupId?: string, includeSubgroup: boolean, sort: string[] }>();

  constructor() {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getGroupPendingRequests(params.groupId, params.includeSubgroup, params.sort)
            .pipe(
              map(readyState),
              catchError(err => of(errorState(err))),
            )
        )
      ),
      takeUntilDestroyed(),
    ).subscribe({
      next: state => {
        if (state.isError) {
          this.state.set('fetchingError');
        } else {
          this.state.set(state.tag);
          if (state.isReady) {
            this.requests.set(state.data);
          }
        }
      },
    });

    toObservable(this.groupId).pipe(
      takeUntilDestroyed(),
    ).subscribe(groupId => {
      this.dataFetching.next({
        groupId,
        includeSubgroup: this.includeSubgroup(),
        sort: this.currentSort(),
      });
    });

    this.destroyRef.onDestroy(() => {
      this.dataFetching.complete();
    });
  }

  onProcessRequests(params: { data: PendingRequest[], type: Action }): void {
    this.state.set('processing');

    const requestMap = new Map<string, string[]>();
    params.data.forEach(elm => {
      const groupID = elm.group.id;
      const memberID = elm.user.id;

      const value = requestMap.get(groupID);
      if (value) requestMap.set(groupID, value.concat([ memberID ]));
      else requestMap.set(groupID, [ memberID ]);
    });

    this.requestActionService.processJoinRequests(requestMap, params.type)
      .subscribe({
        next: result => {
          this.state.set('ready');
          displayResponseToast(this.actionFeedbackService, parseResults(result), params.type);
          this.dataFetching.next({
            groupId: this.groupId(),
            includeSubgroup: this.includeSubgroup(),
            sort: this.currentSort(),
          });
        },
        error: err => {
          this.state.set('ready');
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
  }

  onSubgroupSwitch(selectedIdx: number): void {
    this.includeSubgroup.set(ensureDefined(this.subgroupSwitchItems[selectedIdx]).value);

    this.dataFetching.next({
      groupId: this.groupId(),
      includeSubgroup: this.includeSubgroup(),
      sort: this.currentSort(),
    });
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.currentSort())) {
      this.currentSort.set(sort);
      this.dataFetching.next({
        groupId: this.groupId(),
        includeSubgroup: this.includeSubgroup(),
        sort: this.currentSort(),
      });
    }
  }
}
