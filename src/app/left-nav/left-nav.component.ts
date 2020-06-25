import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: ['./left-nav.component.scss']
})
export class LeftNavComponent implements OnInit, OnChanges {

  @Input() data;
  @Input() user;
  @Input() collapsed = false;
  @Input() signedIn;

  @Output() collapseEvent = new EventEmitter<boolean>();
  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();
  @Output() yourselfSelect = new EventEmitter<any>();
  @Output() groupSelect = new EventEmitter<any>();
  @Output() signInOutEvent = new EventEmitter<any>();
  @Output() joinGroupSelect = new EventEmitter<any>();
  @Output() manageGroupSelect = new EventEmitter<any>();
  @Output() notify = new EventEmitter<any>();

  searchView = false;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(_changes: SimpleChanges) {
  }

  onCollapse(_e) {
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

  onSignInOut(e) {
    this.signInOutEvent.emit(e);
  }

  onJoinGroupSelected(e) {
    this.joinGroupSelect.emit(e);
  }

  onManageGroupSelected(e) {
    this.manageGroupSelect.emit(e);
  }

  onNotifyClicked(e) {
    this.notify.emit(e);
  }

  onSearchEvent(_e) {
    this.searchView = true;
  }

  onSearchCloseEvent(_e) {
    this.searchView = false;
  }

}
