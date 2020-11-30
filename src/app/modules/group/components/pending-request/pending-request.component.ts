import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { SortEvent } from 'primeng/api/sortevent';
import { MessageService } from 'primeng/api';
import {
  ERROR_MESSAGE,
} from '../../../../shared/constants/api';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { Observable, forkJoin, Subject, merge, of } from 'rxjs';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { RequestActionsService } from '../../http-services/request-actions.service';
import { GridColumn, GridColumnGroup } from '../../../shared-components/components/grid/grid.component';
import { map, switchMap } from 'rxjs/operators';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';

type Activity = 'accepting'|'rejecting'|'none';
type Action = 'accept'|'reject';

interface Result {
  countRequests: number;
  countSuccess: number;
}

const groupColumn = { field: 'group.name', header: 'GROUP' };

@Component({
  selector: 'alg-pending-request',
  templateUrl: './pending-request.component.html',
  styleUrls: [ './pending-request.component.scss' ],
})
export class PendingRequestComponent implements OnInit, OnChanges {
  @Input() groupId?: string;
  @Input() showSwitch = true;

  columns: GridColumn[] = [
    { field: 'user.login', header: 'USER' },
    { field: 'at', header: 'REQUESTED ON' },
  ];
  subgroupSwitchItems = [
    { label: 'This group only', includeSubgroup: false },
    { label: 'All subgroups', includeSubgroup: true }
  ];
  requests: PendingRequest[] = [];
  selection: PendingRequest[] = [];
  panel: GridColumnGroup[] = [];
  currentSort: string[] = [];
  includeSubgroup = false;
  collapsed = true;

  state: 'fetching' | 'ready' |'error' = 'fetching';

  ongoingActivity: Activity = 'none';

  private dataFetching = new Subject<{ groupId?: string, includeSubgroup: boolean, sort: string[] }>();

  private dataUpdating = new Subject<{ action: Action, requests: PendingRequest[] }>();

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private messageService: MessageService
  ) {
    this.dataFetching.pipe(
      switchMap(params =>
        merge(
          of(fetchingState()),
          this.getRequestsService.getPendingRequests(params.groupId, params.includeSubgroup, params.sort).pipe(map(readyState))
        )
      )
    ).subscribe(
      state => {
        this.state = state.tag;
        if (isReady(state)) {
          this.requests = state.data;
          if (this.requests.length > 0) this.collapsed = false;
        }
      },
      _err => {
        this.state = 'error';
      }
    );

    this.dataUpdating.pipe(
      switchMap(params =>
        merge(
          of({
            ...fetchingState(),
            action: params.action,
            activity: params.action === 'accept' ? 'accepting' : 'rejecting' as Activity,
          }),
          this.processRequests(params.action, params.requests)
            .pipe(map(result => ({
              ...readyState(result),
              action: params.action,
              activity: 'none' as Activity,
            })))
        )
      )
    ).subscribe(
      state => {
        this.state = state.tag;
        this.ongoingActivity = state.activity;
        if (isReady(state)) {
          this.displayResponseToast(
            this.parseResults(state.data),
            state.action === 'accept' ? 'accept' : 'reject', // still use a matching as it is "by coincidence" that the type of verb match
            state.action === 'accept' ? 'accepted' : 'declined'
          );
          this.selection = [];
          this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
        }
      },
      err => {
        this.state = 'ready';
        this.processRequestError(err);
        this.ongoingActivity = 'none';
      }
    );

  }

  ngOnInit(): void {
    this.panel.push({
      columns: this.columns,
    });
    if (!this.showSwitch) this.columns = [ groupColumn ].concat(this.columns);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.selection = [];
    this.ongoingActivity = 'none';
    this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
  }

  private parseResults(data: Map<string, any>[]): Result {
    const res : Result = { countRequests: 0, countSuccess: 0 };
    data.forEach(elm => {
      res.countRequests += elm.size;
      res.countSuccess += Array.from(elm.values())
        .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
        .reduce((acc, res) => acc + res, 0);
    });
    return res;
  }

  private displayResponseToast(result: Result, verb: string, msg: string): void {
    if (result.countSuccess === result.countRequests) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${result.countSuccess} request(s) have been ${msg}`,
        life: TOAST_LENGTH,
      });
    } else if (result.countSuccess === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Unable to ${verb} the selected request(s).`,
        life: TOAST_LENGTH,
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Partial success',
        detail: `${result.countSuccess} request(s) have been ${msg}, ${result.countRequests - result.countSuccess} could not be executed`,
        life: TOAST_LENGTH,
      });
    }
  }

  private processRequestError(_err: any): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  processRequests(action: Action, requests: PendingRequest[]): Observable<Map<string, any>[]> {
    const requestMap = new Map<string, string[]>();
    requests.forEach(elm => {
      const groupID = elm.group.id;
      const memberID = elm.user.groupId;

      const value = requestMap.get(groupID);
      if (value) requestMap.set(groupID, value.concat([ memberID ]));
      else requestMap.set(groupID, [ memberID ]);
    });
    return forkJoin(
      Array.from(requestMap.entries()).map(elm => {
        if (action === 'accept') return this.requestActionService.acceptJoinRequest(elm[0], elm[1]);
        else return this.requestActionService.rejectJoinRequest(elm[0], elm[1]);
      })
    );
  }

  onAcceptOrReject(action: Action): void {
    if (this.selection.length === 0 || this.ongoingActivity !== 'none') {
      return;
    }

    this.dataUpdating.next({ action: action, requests: this.selection });
  }

  onSelectAll(): void {
    if (this.selection.length === this.requests.length) {
      this.selection = [];
    } else {
      this.selection = this.requests;
    }
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));

    if (sortMeta && JSON.stringify(sortMeta) !== JSON.stringify(this.currentSort)) {
      this.currentSort = sortMeta;
      this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
    }
  }

  onSubgroupSwitch(selectedIdx: number): void {
    this.includeSubgroup = this.subgroupSwitchItems[selectedIdx].includeSubgroup;

    this.columns = this.columns.filter(elm => elm !== groupColumn);
    if (this.includeSubgroup) this.columns = [ groupColumn ].concat(this.columns);

    this.dataFetching.next({ groupId: this.groupId, includeSubgroup: this.includeSubgroup, sort: this.currentSort });
  }

}
