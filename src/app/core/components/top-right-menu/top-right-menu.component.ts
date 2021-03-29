import { Component } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-top-right-menu',
  templateUrl: './top-right-menu.component.html',
  styleUrls: [ './top-right-menu.component.scss' ],
})
export class TopRightMenuComponent {

  readonly menuItems = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: [ 'groups', 'me' ] },
    { label: 'Log out', icon: 'pi pi-power-off', command: ():void => this.sessionService.logout() },
  ]

  sessions$ = this.sessionService.session$;

  constructor(
    private sessionService: UserSessionService
  ) { }

}
