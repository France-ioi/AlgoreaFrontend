import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-task-header',
  templateUrl: './task-header.component.html',
  styleUrls: ['./task-header.component.scss']
})
export class TaskHeaderComponent implements OnInit {

  @Input() isStarted = false;

  @Input() isCoordinator = false;

  @Input() isFinished = true;

  @Input() isCollapsed = false;

  @Input() isFolded = false;

  @Input() isScrolled = false;

  @Input() title;

  constructor() { }

  ngOnInit() {
  }

  onCoordEvent(e) {
    console.log(e);
    this.isCoordinator = !this.isCoordinator;
  }

}
