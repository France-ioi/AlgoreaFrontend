import { Component } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-top-right-menu',
  templateUrl: './top-right-menu.component.html',
  styleUrls: [ './top-right-menu.component.scss' ],
})
export class TopRightMenuComponent {

  readonly menuItems = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: [ 'groups', 'me' ] },
    ...(!appConfig.production
      ? [{ label: 'Invalidate token', icon: 'pi pi-refresh', command: (): void => this.invalidateToken() }]
      : []
    ),
    { label: 'Log out', icon: 'pi pi-power-off', command: ():void => this.sessionService.logout() },
  ]

  sessions$ = this.sessionService.session$;

  constructor(
    private sessionService: UserSessionService,
    private authService: AuthService,
  ) { }

  private invalidateToken(): void {
    const authStatus = this.authService.status$.value;
    if (authStatus.authenticated) this.authService.invalidToken(authStatus);
  }
}
