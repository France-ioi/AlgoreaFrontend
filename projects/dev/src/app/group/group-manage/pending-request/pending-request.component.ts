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
import { TOAST_LENGTH } from '../../../shared/constants/global';
import * as _ from 'lodash';

@Component({
  selector: "app-pending-request",
  templateUrl: "./pending-request.component.html",
  styleUrls: ["./pending-request.component.scss"],
  providers: [MessageService],
})
export class PendingRequestComponent implements OnInit, OnChanges {
  @Input() id;

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
  prevSortMeta = "-at member_id";

  acceptLoading = false;
  rejectLoading = false;
  selection = [];

  _setRequestData(sortBy = GROUP_REQUESTS_API.sort) {
    this.groupService
      .getManagedRequests(this.id, sortBy)
      .subscribe((reqs: PendingRequest[]) => {
        this.requests = [];
        this.selection = [];
    
        this.requests = reqs.map(req => {
          const joining_user = req.joining_user;
          let login;
    
          if (!joining_user.first_name && !joining_user.last_name) {
            login = `${joining_user.login || ""}`;
          } else {
            login = `${joining_user.first_name || ""} ${joining_user.last_name || ""} (${joining_user.login || ""})`;
          }
    
          return {
            member_id: req.member_id,
            "joining_user.login": login,
            grade: joining_user.grade,
            group_id: joining_user.group_id,
            at: req.at,
          };
        });
      });
  }

  _manageRequestData(result, _summary, verb, msg) {
    if (result["success"] === true && result["message"] === "updated") {
      const succ = _.countBy(result["data"], (status) => {
        return status === "success" || status === "unchanged";
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

      this._setRequestData();
    }
  }

  _processRequestError(_err, _summary) {
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
    this._setRequestData();
  }

  onExpandWidth(_e) {}

  onClickAccept(_e) {
    if (
      this.selection.length === 0 ||
      this.acceptLoading ||
      this.rejectLoading
    ) {
      return;
    }

    this.acceptLoading = true;
    this.groupService
      .acceptJoinRequest(
        this.id,
        this.selection.map((req) => req.group_id)
      )
      .subscribe(
        (res) => {
          this._manageRequestData(res, "Accept request", "accept", "accepted");
          this.acceptLoading = false;
        },
        (err) => {
          this._processRequestError(err, "Accept request");
          this.acceptLoading = false;
        }
      );
  }

  onClickReject(_e) {
    if (
      this.selection.length === 0 ||
      this.acceptLoading ||
      this.rejectLoading
    ) {
      return;
    }

    this.rejectLoading = true;
    this.groupService
      .rejectJoinRequest(
        this.id,
        this.selection.map((req) => req.group_id)
      )
      .subscribe(
        (res) => {
          this._manageRequestData(res, "Reject request", "reject", "declined");
          this.rejectLoading = false;
        },
        (err) => {
          this._processRequestError(err, "Reject request");
          this.rejectLoading = false;
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

  onHeaderCheckboxToggle(event) {
    if (event.checked) {
      this.selection = this.requests;
    } else {
      this.selection = [];
    }
  }

  onCustomSort(event: SortEvent) {
    let diff = false;

    const sortBy = event.multiSortMeta.map((meta) =>
      meta.order === -1 ? `-${meta.field}` : meta.field
    );

    if (sortBy.sort().join(" ") !== this.prevSortMeta) {
      diff = true;
    }

    if (!diff) {
      return;
    }

    this.prevSortMeta = sortBy.sort().join(" ");
    this._setRequestData(sortBy);
  }
}
