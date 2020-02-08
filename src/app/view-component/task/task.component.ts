import { Component, OnInit, HostListener } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { EditService } from 'src/app/services/edit.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

  status;
  taskdata;
  parents;
  parentSkills;

  editSubscription: Subscription;

  constructor(
    private editService: EditService,
    private activatedRoute: ActivatedRoute
  ) { 
  }

  findParents(node) {
    if (!node) {
      return ;
    }

    this.parentSkills.push(node);
    this.parents.push(node.title);
    this.findParents(node.parent);
  }

  @HostListener('window:scroll', ['$event'])
  onScrollContent(e) {
    if (window.pageYOffset > 30 && !this.status.scrolled) {
      this.status.scrolled = true;
    } else if (window.pageYOffset <= 30 && this.status.scrolled) {
      this.status.scrolled = false;
    }
  }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((paramMap: ParamMap) => {
      const refresh = paramMap.get('refresh');
      if (refresh) {
        let param = history.state;
        this.taskdata = param.taskdata;

        this.parents = [];
        this.parentSkills = [];
        this.findParents(this.taskdata);
        if (this.parents.length > 0) {
          this.parents.shift();
          this.parents.reverse();
          this.parentSkills.shift();
          this.parentSkills.reverse();
        }
      }
    });

    this.editSubscription = this.editService.getOb().subscribe(res => {
      this.status = res;
    });
  }

  ngOnDestroy() {
    this.editSubscription.unsubscribe();
  }

}
