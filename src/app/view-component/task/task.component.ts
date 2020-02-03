import { Component, OnInit, HostListener } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

  scrolled;
  folded;
  isStarted;
  collapsed;
  activityORSkill;
  taskdata;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { 
  }

  @HostListener('window:scroll', ['$event'])
  onScrollContent(e) {
    if (window.pageYOffset > 30 && !this.scrolled) {
      this.scrolled = true;
    } else if (window.pageYOffset <= 30 && this.scrolled) {
      this.scrolled = false;
    }
  }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((paramMap: ParamMap) => {
      const refresh = paramMap.get('refresh');
      if (refresh) {
        let param = history.state;
        this.scrolled = param.scrolled;
        this.folded = param.folded;
        this.isStarted = param.isStarted;
        this.collapsed = param.collapsed;
        this.activityORSkill = param.activityORSkill;
        this.taskdata = param.taskdata;
      }
    });
  }

}
