import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserSession } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent implements OnInit, OnChanges {

  @Input() collapsed = false;
  @Input() session?: UserSession;

  @Output() collapse = new EventEmitter<boolean>();

  searchView = false;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(_changes: SimpleChanges): void {
  }

  onCollapse(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.collapse.emit(this.collapsed);
  }

  onSearchEvent(): void {
    this.searchView = true;
  }

  onSearchCloseEvent(): void {
    this.searchView = false;
  }

}
