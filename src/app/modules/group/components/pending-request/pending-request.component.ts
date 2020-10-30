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
import { Observable, forkJoin } from 'rxjs';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { RequestActionsService } from '../../http-services/request-actions.service';
import { GridColumn, GridColumnGroup } from '../../../shared-components/components/grid/grid.component';

export enum Activity {
  Accepting,
  Rejecting,
  None
}

export enum Action {
  Accept,
  Reject
}

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

  // Make the enums usable in the html template
  Action = Action;
  Activity = Activity;

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
  status: 'loading' | 'loaded' | 'empty' |'error' = 'loading';

  ongoingActivity: Activity = Activity.None;

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.panel.push({
      columns: this.columns,
    });
    if (!this.showSwitch) this.columns = [ groupColumn ].concat(this.columns);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.selection = [];
    this.ongoingActivity = Activity.None;
    this.reloadData();
  }

  private reloadData(): void {
    if (!this.groupId) return;

    this.status = 'loading';
    this.getRequestsService
      .getPendingRequests(this.groupId, this.includeSubgroup, this.currentSort)
      .subscribe(
        (reqs: PendingRequest[]) => {
          this.requests = reqs;
          this.status = reqs.length ? 'loaded' : 'empty';
          if (reqs.length) this.collapsed = false;
        },
        _err => {
          this.status = 'error';
        }
      );
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

  processRequests(action: Action): Observable<Map<string, any>[]> {
    const requestMap = new Map<string, string[]>();
    this.selection.forEach(elm => {
      const groupID = elm.group.id;
      const memberID = elm.user.group_id;

      const value = requestMap.get(groupID);
      if (value) requestMap.set(groupID, value.concat([ memberID ]));
      else requestMap.set(groupID, [ memberID ]);
    });
    return forkJoin(
      Array.from(requestMap.entries()).map(elm => {
        if (action === Action.Accept) return this.requestActionService.acceptJoinRequest(elm[0], elm[1]);
        else return this.requestActionService.rejectJoinRequest(elm[0], elm[1]);
      })
    );
  }

  onAcceptOrReject(action: Action): void {
    if (this.selection.length === 0 || this.ongoingActivity !== Activity.None) {
      return;
    }
    this.ongoingActivity = (action === Action.Accept) ? Activity.Accepting : Activity.Rejecting;

    const resultObserver : Observable<Map<string, any>[]> = this.processRequests(action);

    resultObserver
      .subscribe(
        res => {
          this.displayResponseToast(
            this.parseResults(res),
            action === Action.Accept ? 'accept' : 'reject',
            action === Action.Accept ? 'accepted' : 'declined'
          );
          this.reloadData();
          this.ongoingActivity = Activity.None;
          this.selection = [];
        },
        err => {
          this.processRequestError(err);
          this.ongoingActivity = Activity.None;
        }
      );
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
      this.reloadData();
    }
  }

  onSubgroupSwitch(selectedIdx: number): void {
    this.includeSubgroup = this.subgroupSwitchItems[selectedIdx].includeSubgroup;

    this.columns = this.columns.filter(elm => elm !== groupColumn);
    if (this.includeSubgroup) this.columns = [ groupColumn ].concat(this.columns);

    this.reloadData();
  }

}
