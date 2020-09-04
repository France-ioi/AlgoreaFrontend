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
import * as _ from 'lodash-es';
import { Observable } from 'rxjs';
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

@Component({
  selector: 'alg-pending-request',
  templateUrl: './pending-request.component.html',
  styleUrls: ['./pending-request.component.scss'],
  providers: [ MessageService ]
})
export class PendingRequestComponent implements OnInit, OnChanges {
  @Input() groupId: string;

  // Make the enums usable in the html template
  Action = Action;
  Activity = Activity;

  columns: GridColumn[] = [
    { field: 'user.login', header: 'USER' },
    { field: 'at', header: 'REQUESTED ON' },
  ];
  requests: PendingRequest[] = [];
  selection: PendingRequest[] = [];
  panel: GridColumnGroup[] = [];
  currentSort: string[] = [];

  ongoingActivity: Activity = Activity.None;

  constructor(
    private getRequestsService: GetRequestsService,
    private requestActionService: RequestActionsService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.panel.push({
      columns: this.columns,
    });
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.selection = [];
    this.reloadData();
    this.ongoingActivity = Activity.None;
  }

  private reloadData() {
    this.getRequestsService
      .getPendingRequests(this.groupId, this.currentSort)
      .subscribe((reqs: PendingRequest[]) => {
        this.requests = reqs;
      });
  }

  private parseResults(data: Map<string, any>): Result {
    return {
      countRequests: data.size,
      countSuccess: Array.from(data.values())
        .map(res => ['success', 'unchanged'].includes(res) ? 1 : 0)
        .reduce( (acc, res) => acc + res, 0 )
    };
  }

  private displayResponseToast(result: Result, verb: string, msg: string) {
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

  private processRequestError(_err: any) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  onAcceptOrReject(action: Action) {
    if (this.selection.length === 0 || this.ongoingActivity !== Activity.None) {
      return;
    }
    this.ongoingActivity = (action === Action.Accept) ? Activity.Accepting : Activity.Rejecting;

    const groupIds = this.selection.map(req => req.user.group_id);

    let resultObserver: Observable<Map<string, any>>;
    if (action === Action.Accept) {
      resultObserver = this.requestActionService.acceptJoinRequest(this.groupId, groupIds);
    } else {
      resultObserver = this.requestActionService.rejectJoinRequest(this.groupId, groupIds);
    }

    resultObserver
      .subscribe(
        (res) => {
          this.displayResponseToast(
            this.parseResults(res),
            action === Action.Accept ? 'accept' : 'reject',
            action === Action.Accept ? 'accepted' : 'declined'
          );
          this.reloadData();
          this.ongoingActivity = Activity.None;
          this.selection = [];
        },
        (err) => {
          this.processRequestError(err);
          this.ongoingActivity = Activity.None;
        }
      );
  }

  onSelectAll() {
    if (this.selection.length === this.requests.length) {
      this.selection = [];
    } else {
      this.selection = this.requests;
    }
  }

  onCustomSort(event: SortEvent) {
    const sortMeta = event.multiSortMeta.map((meta) =>
      meta.order === -1 ? `-${meta.field}` : meta.field
    );

    if (!_.isEqual(sortMeta, this.currentSort)) {
      this.currentSort = sortMeta;
      this.reloadData();
    }
  }
}
