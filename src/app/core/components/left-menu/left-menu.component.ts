import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserSession } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent {

  @Input() collapsed = false;
  @Input() session?: UserSession;

  @Output() collapse = new EventEmitter<boolean>();

  onCollapse(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.collapse.emit(collapsed);
  }

}
