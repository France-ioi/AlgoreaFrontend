import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StatusService } from "../../shared/services/status.service";
import { GroupService } from "../../shared/services/api/group.service";
import { Group } from "../../shared/models/group.model";
import { PendingRequest } from "../../shared/models/pending-request.model";
import { Member } from "../../shared/models/member.model";

@Component({
  selector: "app-group-manage",
  templateUrl: "./group-manage.component.html",
  styleUrls: ["./group-manage.component.scss"],
})
export class GroupManageComponent implements OnInit {
  groupdata = {};
  groupId;
  status;

  memberData = [];
  memberCols = [
    { field: "id", header: "ID" },
    { field: "name", header: "Name" },
    { field: "user.login", header: "User name" },
    { field: "user.grade", header: "Grade" },
    { field: "member_since", header: "Member Since" },
  ];
  multiSortMeta = [
    { field: "id", order: 1 },
    { field: "member_since", order: -1 },
  ];
  prevSortMeta = "-member_since id";
  memberPanel = [
    {
      name: "Group Info",
      columns: this.memberCols,
    },
  ];

  private _setMemberData(members: Member[]) {
    this.memberData = [];

    for (const member of members) {
      this.memberData.push({
        member_since: member.member_since,
        name: `${member.user.first_name} ${member.user.last_name}`,
        "user.login": member.user.login,
        "user.grade": member.user.grade,
        id: member.id,
      });
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusService: StatusService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    const id = this.activatedRoute.snapshot.params.id;
    
    this.activatedRoute.params.subscribe(routeParams => {
      this.groupId = routeParams.id;
      console.log(this.groupId)
    })

    this.groupService.getManagedGroup(id).subscribe((group: Group) => {
      this.groupdata = {
        ID: group.id,
        name: group.name,
        type: group.type,
        grades: [group.grade],
        date: group.created_at,
      };
    });

    this.groupService.getGroupMembers(51).subscribe((members: Member[]) => {
      this._setMemberData(members);
    });

    this.statusService.getObservable().subscribe((res) => {
      this.status = res;
    });
  }

  onAcceptRequest(e) {
  }

  onRejectRequest(e) {
  }

  onExpandWidth(e) {
  }
}
