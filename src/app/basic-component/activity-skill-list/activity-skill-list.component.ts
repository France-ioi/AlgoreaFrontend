import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EditService } from 'src/app/shared/services/edit.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity-skill-list',
  templateUrl: './activity-skill-list.component.html',
  styleUrls: ['./activity-skill-list.component.scss']
})
export class ActivitySkillListComponent implements OnInit, OnDestroy {
  @Input() data;
  @Input() activity;
  status;
  unsubscribe: Subscription;

  constructor(
    private router: Router,
    private editService: EditService
  ) { }

  ngOnInit() {
    this.unsubscribe = this.editService.getOb().subscribe(res => {
      this.status = res;
    });
  }

  onItemClick(e) {
    this.status.selectedType = 2;
    this.status.activityORSkill = this.activity;
    this.status.userTitle = e.title;
    this.editService.setValue(this.status);
    this.router.navigate([`/task/${e.ID}`], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        taskdata: e
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.unsubscribe();
  }

}
