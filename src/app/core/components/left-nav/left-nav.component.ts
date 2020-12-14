import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UserSession } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent {

  @Input() collapsed = false;
  @Input() session?: UserSession;

  @Output() collapse = new EventEmitter<boolean>();

  searchView = false;

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
