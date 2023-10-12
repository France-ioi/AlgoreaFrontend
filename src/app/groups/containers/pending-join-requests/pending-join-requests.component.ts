import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { GetRequestsService, PendingRequest } from '../../data-access/get-requests.service';
import { Action, parseResults, RequestActionsService } from '../../data-access/request-actions.service';
import { GridColumn } from 'src/app/ui-components/grid/grid.component';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { fetchingState, readyState } from 'src/app/utils/state';
import { displayResponseToast } from 'src/app/groups/containers/pending-request/pending-request-response-handling';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ensureDefined } from 'src/app/utils/assert';
import { HttpErrorResponse } from '@angular/common/http';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { NgIf } from '@angular/common';
import { PendingRequestComponent } from '../pending-request/pending-request.component';

const groupColumn = { field: 'group.name', header: $localize`GROUP` };

@Component({
  selector: 'alg-pending-join-requests',
  templateUrl: './pending-join-requests.component.html',
  styleUrls: [ './pending-join-requests.component.scss' ],
  standalone: true,
  imports: [
    PendingRequestComponent,
    NgIf,
    SelectionComponent,
  ],
})
export class PendingJoinRequestsComponent implements OnChanges, OnDestroy {

  // if groupId is undefined, pending join requests from all managed group will be used.
  @Input() groupId?: string;
  @Input() showSwitch = true;

  requests: PendingRequest[] = [];

  columns: GridColumn[] = [
    { field: 'user.login', header: $localize`USER` },
    { field: 'at', header: $localize`REQUESTED ON` },
  ];
  readonly subgroupSwitchItems = [
    { label: $localize`This group only`, value: false },
    { label: $localize`All subgroups`, value: true }
  ];
  includeSubgroup = false;

  state: 'fetching' | 'processing' | 'ready' | 'fetchingError' = 'fetching';
  currentSort: string[] = [];

  private dataFetching = new Subject<{ groupId?: string, includeSubgroup: boolean, sort: string[] }>();

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getGroupPendingRequests(params.groupId, params.includeSubgroup, params.sort)
            .pipe(map(readyState))
        )
      )
    ).subscribe({
      next: state => {
        this.state = state.tag;
        if (state.isReady) {
          this.requests = state.data;
        }
      },
      error: _err => {
        this.state = 'fetchingError';
      }
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.showSwitch) this.columns = [ groupColumn ].concat(this.columns);
    this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
  }

  ngOnDestroy(): void {
    this.dataFetching.complete();
  }


  onProcessRequests(params: { data: PendingRequest[], type: Action }): void {
    this.state = 'processing';

    const requestMap = new Map<string, string[]>();
    params.data.forEach(elm => {
      const groupID = elm.group.id;

      if (!elm.user) {
        throw new Error('Unexpected: Missed user ID');
      }

      const memberID = elm.user.id;

      const value = requestMap.get(groupID);
      if (value) requestMap.set(groupID, value.concat([ memberID ]));
      else requestMap.set(groupID, [ memberID ]);
    });

    this.requestActionService.processJoinRequests(requestMap, params.type)
      .subscribe({
        next: result => {
          this.state = 'ready';
          displayResponseToast(this.actionFeedbackService, parseResults(result), params.type);
          this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
        },
        error: err => {
          this.state = 'ready';
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
  }

  onSubgroupSwitch(selectedIdx: number): void {
    this.includeSubgroup = ensureDefined(this.subgroupSwitchItems[selectedIdx]).value;

    this.columns = this.columns.filter(elm => elm !== groupColumn);
    if (this.includeSubgroup) this.columns = [ groupColumn ].concat(this.columns);

    this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
  }

  onFetch(sort: string[]): void {
    if (JSON.stringify(sort) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sort;
      this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
    }
  }
}
