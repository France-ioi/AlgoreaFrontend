import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";

@Component({
  selector: "app-activity-skill-list",
  templateUrl: "./activity-skill-list.component.html",
  styleUrls: ["./activity-skill-list.component.scss"],
})
export class ActivitySkillListComponent implements OnInit, OnDestroy {
  @Input() data;
  @Input() activity;
  status;
  unsubscribe: Subscription;

  constructor(private router: Router)
  {}

  ngOnInit() {
  }

  onItemClick(e) {
    this.status.selectedType = 2;
    this.status.activityORSkill = this.activity;
    this.status.userTitle = e.title;
    this.router.navigate([`/design/task/${e.ID}`], {
      queryParams: {
        refresh: new Date().getTime(),
      },
      state: {
        taskdata: e,
      },
    });
  }

  ngOnDestroy() {
  }
}
