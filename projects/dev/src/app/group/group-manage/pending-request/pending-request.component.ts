import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { GroupService } from "../../../shared/services/api/group.service";
import { PendingRequest } from "../../../shared/models/pending-request.model";
import { SortEvent } from "primeng/api/sortevent";
import { MessageService } from "primeng/api";
import {
  ERROR_MESSAGE, GROUP_REQUESTS_API,
} from "../../../shared/constants/api";
import { TOAST_LENGTH } from "../../../shared/constants/global";
import * as _ from "lodash";
import { RequestActionResponse } from '../../../shared/models/requet-action-response.model';
import { Observable } from 'rxjs';

export enum AcceptReject {
  Accept = "accept",
  Reject = "reject",
  None = "none"
};

@Component({
  selector: "app-pending-request",
  templateUrl: "./pending-request.component.html",
  styleUrls: ["./pending-request.component.scss"],
  providers: [MessageService],
})
export class PendingRequestComponent implements OnInit, OnChanges {
  @Input() id;

  AcceptReject = AcceptReject;

  columns = [
    { field: "member_id", header: "ID" },
    { field: "joining_user.login", header: "LOGIN" },
    { field: "at", header: "REQUESTED ON" },
  ];
  requests = [];
  panel = [];
  multiSortMeta = [
    { field: "at", order: -1 },
    { field: "member_id", order: 1 },
  ];
  prevSortMeta: string[] = GROUP_REQUESTS_API.sort;

  requestAction: AcceptReject = AcceptReject.None;
  selection = [];

  _reloadData() {
    this.groupService
      .getManagedRequests(this.id, this.prevSortMeta)
      .subscribe((reqs: PendingRequest[]) => {
        this.requests = reqs.map((req) => {
          return {
            member_id: req.member_id,
            joining_user: req.joining_user,
            at: req.at,
          };
        });
      });
  }

  _handleActionResponse(result: RequestActionResponse, verb: string, msg: string) {
    if (result.success === true && result.message === "updated") {
      const succ = _.countBy(result.data, (status: string) => {
        return ["success", "unchanged"].includes(status);
      });

      if (succ.false === undefined || succ.false === 0) {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: `${succ.true} request(s) have been ${msg}`,
          life: TOAST_LENGTH,
        });
      } else if (succ.true === undefined || succ.true === 0) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: `Unable to ${verb} the selected request(s).`,
          life: TOAST_LENGTH,
        });
      } else {
        this.messageService.add({
          severity: "warn",
          summary: "Partial success",
          detail: `${succ.true} request(s) have been ${msg}, ${succ.false} could not be executed`,
          life: TOAST_LENGTH,
        });
      }

      this._reloadData();
    }
  }

  _processRequestError(_err) {
    this.messageService.add({
      severity: "error",
      summary: "Error",
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  constructor(
    private groupService: GroupService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.panel.push({
      name: "Pending Requests",
      columns: this.columns,
    });
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.selection = [];
    this._reloadData();
  }

  onAcceptOrReject(type: AcceptReject) {
    if (this.selection.length === 0 || this.requestAction !== AcceptReject.None) {
      return;
    }

    let resultObserver: Observable<RequestActionResponse>;
    this.requestAction = type;
    
    const group_ids = this.selection.map((req: PendingRequest) => req.joining_user.group_id);

    if (type === AcceptReject.Accept) {
      resultObserver = this.groupService.acceptJoinRequest(this.id, group_ids);
    } else {
      resultObserver = this.groupService.rejectJoinRequest(this.id, group_ids);
    }

    resultObserver.subscribe(
      (res: RequestActionResponse) => {
        this._handleActionResponse(
          res,
          type,
          type === AcceptReject.Accept ? "accepted" : "declined"
        );
        this.requestAction = AcceptReject.None;
        this.selection = [];
      },
      (err) => {
        this._processRequestError(err);
        this.requestAction = AcceptReject.None;
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

  onSelectAllCheckboxToggle(event) {
    if (event.checked) {
      this.selection = this.requests;
    } else {
      this.selection = [];
    }
  }

  onCustomSort(event: SortEvent) {
    const sortMeta = event.multiSortMeta.map((meta) =>
      meta.order === -1 ? `-${meta.field}` : meta.field
    );

    if (!_.isEqual(_.sortBy(sortMeta), _.sortBy(this.prevSortMeta))) {
      this.prevSortMeta = sortMeta;
      this._reloadData();
    }
  }
}
