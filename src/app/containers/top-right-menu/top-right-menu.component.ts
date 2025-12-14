import { Component, inject, Input } from '@angular/core';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth/auth.service';
import { APPCONFIG } from 'src/app/config';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { UserSessionService } from '../../services/user-session.service';
import { LayoutService } from '../../services/layout.service';
import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { UrlCommand } from 'src/app/utils/url';
import { LetDirective } from '@ngrx/component';
import { RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';

export interface MenuItem {
  label: string,
  icon: string,
  routerLink?: UrlCommand,
  command?: () => void,
}

@Component({
  selector: 'alg-top-right-menu',
  templateUrl: './top-right-menu.component.html',
  styleUrls: [ './top-right-menu.component.scss' ],
  standalone: true,
  imports: [
    AsyncPipe,
    ButtonIconComponent,
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem,
    NgClass,
    NgTemplateOutlet,
    LetDirective,
    RouterLink,
  ],
})
export class TopRightMenuComponent {
  private config = inject(APPCONFIG);
  @Input() styleClass?: string;

  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  readonly menuItems$ = this.sessionService.userProfile$.pipe(
    map(profile =>
      [
        {
          label: 'Profile',
          icon: 'ph ph-user-list',
          routerLink: this.groupRouter.urlArray(rawGroupRoute(profile), [ 'personal-data' ]),
        },
        ...this.getDevelopmentMenuItems(),
        { label: 'Log out', icon: 'ph ph-sign-out', command: ():void => this.sessionService.logout() },
      ]
    ),
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
    if (environment.production) return [];
    return [
      { label: 'Invalidate token', icon: 'ph ph-arrow-clockwise', command: (): void => this.invalidateToken() },
    ];
  }

}
