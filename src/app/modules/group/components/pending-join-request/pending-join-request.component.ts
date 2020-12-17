import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { Action, parseResults, RequestActionsService } from '../../http-services/request-actions.service';
import { GridColumn } from '../../../shared-components/components/grid/grid.component';
import { merge, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { MessageService } from 'primeng/api';
import {
  displayResponseToast,
  processRequestError
} from 'src/app/modules/group/components/pending-request/pending-request-response-handling';

const groupColumn = { field: 'group.name', header: 'GROUP' };

@Component({
  selector: 'alg-pending-join-request',
  templateUrl: './pending-join-request.component.html',
  styleUrls: [ './pending-join-request.component.scss' ],
})
export class PendingJoinRequestsComponent implements OnChanges, OnDestroy {

  // if groupId is undefined, pending join requests from all managed group will be used.
  @Input() groupId?: string;
  @Input() showSwitch = true;

  requests: PendingRequest[] = [];

  columns: GridColumn[] = [
    { field: 'user.login', header: 'USER' },
    { field: 'at', header: 'REQUESTED ON' },
  ];
  readonly subgroupSwitchItems = [
    { label: 'This group only', includeSubgroup: false },
    { label: 'All subgroups', includeSubgroup: true }
  ];
  includeSubgroup = false;

  state: 'fetching' | 'processing' | 'ready' | 'fetchingError' = 'fetching';
  currentSort: string[] = [];

  private dataFetching = new Subject<{ groupId?: string, includeSubgroup: boolean, sort: string[] }>();

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private messageService: MessageService,
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getGroupPendingRequests(params.groupId, params.includeSubgroup, params.sort)
            .pipe(map(readyState))
        )
      )
    ).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) {
          this.requests = state.data;
        }
      },
      _err => {
        this.state = 'fetchingError';
      }
    );
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
      const memberID = elm.user.id;

      const value = requestMap.get(groupID);
      if (value) requestMap.set(groupID, value.concat([ memberID ]));
      else requestMap.set(groupID, [ memberID ]);
    });

    this.requestActionService.processJoinRequests(requestMap, params.type)
      .subscribe(
        result => {
          this.state = 'ready';
          displayResponseToast(this.messageService, parseResults(result), params.type);
          this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
        },
        _err => {
          this.state = 'ready';
          processRequestError(this.messageService);
        }
      );
  }

  onSubgroupSwitch(selectedIdx: number): void {
    this.includeSubgroup = this.subgroupSwitchItems[selectedIdx].includeSubgroup;

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
