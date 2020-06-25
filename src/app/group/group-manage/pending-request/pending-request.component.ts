import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { GroupService } from '../../../shared/services/api/group.service';
import { PendingRequest } from '../../../shared/models/pending-request.model';
import { SortEvent } from 'primeng/api/sortevent';
import { MessageService } from 'primeng/api';
import {
  ERROR_MESSAGE,
} from '../../../shared/constants/api';
import { TOAST_LENGTH } from '../../../shared/constants/global';
import * as _ from 'lodash';
import { RequestActionResponse } from '../../../shared/models/requet-action-response.model';
import { Observable } from 'rxjs';

export enum Activity {
  Accepting,
  Rejecting,
  None
}

export enum Action {
  Accept,
  Reject
}

@Component({
  selector: 'alg-pending-request',
  templateUrl: './pending-request.component.html',
  styleUrls: ['./pending-request.component.scss'],
  providers: [ MessageService ]
})
export class PendingRequestComponent implements OnInit, OnChanges {
  @Input() id: string;

  Action = Action;  // Make the enum usable in the html template

  columns = [
    { field: 'joining_user.login', header: 'LOGIN' },
    { field: 'at', header: 'REQUESTED ON' },
  ];
  requests: PendingRequest[] = [];
  selection: PendingRequest[] = [];
  panel = [];
  currentSort: string[] = [];

  onGoingActivity: Activity = Activity.None;

  _reloadData() {
    this.groupService
      .getManagedRequests(this.id, this.currentSort)
      .subscribe((reqs: PendingRequest[]) => {
        this.requests = reqs;
      });
  }

  _displayResponseToast(data: Map<string, string>, verb: string, msg: string) {
    // count number of success
    const results = Array.from(data.values());
    const nbReq = results.length;
    const nbSucc = results
      .map(res => ['success', 'unchanged'].includes(res) ? 1 : 0)
      .reduce( (acc, res) => acc + res, 0 );

    if (nbSucc === nbReq) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${nbSucc} request(s) have been ${msg}`,
        life: TOAST_LENGTH,
      });
    } else if (nbSucc === 0) {
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
        detail: `${nbSucc} request(s) have been ${msg}, ${nbReq - nbSucc} could not be executed`,
        life: TOAST_LENGTH,
      });
    }
  }

  _processRequestError(_err) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  isAccepting() {
    return this.onGoingActivity === Activity.Accepting;
  }

  isRejecting() {
    return this.onGoingActivity === Activity.Rejecting;
  }

  isIdle() {
    return this.onGoingActivity === Activity.None;
  }

  constructor(
    private groupService: GroupService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.panel.push({
      name: 'Pending Requests',
      columns: this.columns,
    });
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.selection = [];
    this._reloadData();
  }

  onAcceptOrReject(action: Action) {
    if (this.selection.length === 0 || this.onGoingActivity !== Activity.None) {
      return;
    }

    let resultObserver: Observable<RequestActionResponse>;
    this.onGoingActivity = (action === Action.Accept) ? Activity.Accepting : Activity.Rejecting;

    const groupIds = this.selection.map(req => req.joining_user.group_id);

    if (action === Action.Accept) {
      resultObserver = this.groupService.acceptJoinRequest(this.id, groupIds);
    } else {
      resultObserver = this.groupService.rejectJoinRequest(this.id, groupIds);
    }

    resultObserver
    .subscribe(
      (res: RequestActionResponse) => {
        this._displayResponseToast(
          res.data,
          action === Action.Accept ? 'accept' : 'reject',
          action === Action.Accept ? 'accepted' : 'declined'
        );
        this._reloadData();
        this.onGoingActivity = Activity.None;
        this.selection = [];
      },
      (err) => {
        this._processRequestError(err);
        this.onGoingActivity = Activity.None;
      }
    );
  }

  onSelectAll(_event) {
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
      this._reloadData();
    }
  }
}
