import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { rawGroupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'alg-top-right-menu',
  templateUrl: './top-right-menu.component.html',
  styleUrls: [ './top-right-menu.component.scss' ],
})
export class TopRightMenuComponent {
  @Input() styleClass?: string;

  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  readonly menuItems$ = combineLatest([
    this.sessionService.userProfile$,
    this.layoutService.isNarrowScreen$,
  ]).pipe(
    map(([ profile, isNarrowScreen ]) => {
      const items = [
        {
          label: 'Profile',
          icon: 'ph ph-user-list',
          routerLink: this.groupRouter.urlArray(rawGroupRoute(profile), [ 'personal-data' ]),
        },
        ...this.getDevelopmentMenuItems(),
        { label: 'Log out', icon: 'ph ph-sign-out', command: ():void => this.sessionService.logout() },
      ];
      return isNarrowScreen ? [{
        label: profile.login,
        items,
      }] : items;
    }),
  );

  userLogin$ = this.sessionService.session$.pipe(map(session => session?.login), distinctUntilChanged());

  constructor(
    private sessionService: UserSessionService,
    private authService: AuthService,
    private groupRouter: GroupRouter,
    private layoutService: LayoutService,
  ) { }

  private invalidateToken(): void {
    const authStatus = this.authService.status$.value;
    if (authStatus.authenticated) this.authService.invalidToken(authStatus);
  }

  private getDevelopmentMenuItems(): MenuItem[] {
    if (appConfig.production) return [];
    return [
      { label: 'Invalidate token', icon: 'ph ph-arrow-clockwise', command: (): void => this.invalidateToken() },
    ];
  }

}
