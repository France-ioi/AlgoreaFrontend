import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserSession } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent {

  @Input() session?: UserSession;

  @Output() hideLeftMenu = new EventEmitter<void>();

  toggleDisplay(shown: boolean): void {
    if (!shown) this.hideLeftMenu.emit();
  }

}
