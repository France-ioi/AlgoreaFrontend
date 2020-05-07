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
  ERROR_MESSAGE,
  PENDING_REQUEST_SUCCESS_MESSAGE,
} from "../../../shared/constants/api";

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

  groupSwitch = [
    {
      label: "This group only",
    },
    {
      label: "All subgroups",
    },
  ];

  acceptLoading = false;
  rejectLoading = false;
  selection = [];

  _setRequestData(reqs: PendingRequest[]) {
    this.requests = [];

    for (const req of reqs) {
      this.requests.push({
        member_id: req.member_id,
        "joining_user.login": `${req.joining_user.first_name || ""} ${
          req.joining_user.last_name || ""
        } (${req.joining_user.login || ""})`,
        grade:
          req.joining_user && req.joining_user.grade
            ? req.joining_user.grade
            : null,
        joining_user: req.joining_user,
        at: req.at,
      });
    }
  }

  _manageRequestData(res, summary, msg) {
    if (res["success"] === true && res["message"] === "updated") {
      const status = res["data"];
      let toRemove = [];

      for (const prop in status) {
        if (status[prop] === "success") {
          toRemove.push(prop);
        }
      }

      this.requests = this.requests.filter((req: PendingRequest) => {
        return toRemove.indexOf(req.joining_user.group_id);
      });
      this.messageService.add({
        severity: "success",
        summary: summary,
        detail: msg,
      });
    } else if (res["success"] === false) {
      this.messageService.add({
        severity: "error",
        summary: summary,
        detail: ERROR_MESSAGE.fail,
      });
    }
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
    this.groupService
      .getManagedRequests(this.id)
      .subscribe((reqs: PendingRequest[]) => {
        this._setRequestData(reqs);
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.groupService
      .getManagedRequests(this.id)
      .subscribe((reqs: PendingRequest[]) => {
        this._setRequestData(reqs);
      });
  }

  onExpandWidth(e) {}

  onClickAccept(e) {
    if (this.selection.length === 0) {
      return;
    }

    this.acceptLoading = true;
    this.groupService
      .acceptJoinRequest(
        this.id,
        this.selection.map((val) => val.joining_user.group_id)
      )
      .subscribe((res) => {
        this._manageRequestData(res, "Accept request", PENDING_REQUEST_SUCCESS_MESSAGE.accept);
        this.acceptLoading = false;
      });
  }

  onClickReject(e) {
    this.rejectLoading = true;
    this.groupService
      .rejectJoinRequest(
        this.id,
        this.selection.map((val) => val.joining_user.group_id)
      )
      .subscribe((res) => {
        this._manageRequestData(res, "Reject request", PENDING_REQUEST_SUCCESS_MESSAGE.reject);
        this.rejectLoading = false;
      });
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
    this.groupService
      .getManagedRequests(this.id, sortBy)
      .subscribe((reqs: PendingRequest[]) => {
        this._setRequestData(reqs);
      });
  }
}
