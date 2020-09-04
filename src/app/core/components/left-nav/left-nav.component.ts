import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: ['./left-nav.component.scss']
})
export class LeftNavComponent implements OnInit, OnChanges {

  @Input() collapsed = false;
  @Input() signedIn;

  @Output() collapse = new EventEmitter<boolean>();
  @Output() notify = new EventEmitter<any>();

  searchView = false;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(_changes: SimpleChanges) {
  }

  onCollapse(collapsed: boolean) {
    this.collapsed = collapsed;
    this.collapse.emit(this.collapsed);
  }

  onNotifyClicked(e) {
    this.notify.emit(e);
  }

  onSearchEvent() {
    this.searchView = true;
  }

  onSearchCloseEvent() {
    this.searchView = false;
  }

}
