import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: ['./left-nav.component.scss']
})
export class LeftNavComponent implements OnInit, OnChanges {

  @Input() data;
  @Input() user;
  @Input() collapsed = false;

  @Output() collapseEvent = new EventEmitter<boolean>();
  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();
  @Output() yourselfSelect = new EventEmitter<any>();
  @Output() groupSelect = new EventEmitter<any>();

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
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

  onYourselfSelected(e) {
    this.yourselfSelect.emit(e);
  }

  onGroupSelected(e) {
    this.groupSelect.emit(e);
  }

}
