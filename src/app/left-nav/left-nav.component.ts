import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: ['./left-nav.component.scss']
})
export class LeftNavComponent implements OnInit {

  @Input() data;
  @Input() user;
  @Output() collapseEvent = new EventEmitter<boolean>();
  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();

  @Input() collapsed = false;

  constructor() { }

  ngOnInit() {
  }

  onCollapse(e) {
    this.collapsed = !this.collapsed;
    this.collapseEvent.emit(this.collapsed);
  }

  onSkillSelected(e) {
    this.skillSelect.emit(e);
  }

  onActivitySelected(e) {
    this.activitySelect.emit(e);
  }

}
