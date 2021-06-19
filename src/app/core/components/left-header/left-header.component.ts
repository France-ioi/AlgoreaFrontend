import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { LayoutService } from 'src/app/shared/services/layout.service';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ]
})
export class LeftHeaderComponent {

  @Input() compactMode = false;

  showHeaders = true;

  constructor(
    private authService: AuthService,
    private layoutService: LayoutService
  ) { }

  hideLeftMenuAndHeaders(): void {
    this.layoutService.toggleLeftMenuAndHeaders(false);
  }

  showLeftMenuAndHeaders(): void {
    this.layoutService.toggleLeftMenuAndHeaders(true);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
