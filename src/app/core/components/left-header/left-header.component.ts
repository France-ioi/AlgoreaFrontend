import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ]
})
export class LeftHeaderComponent {

  @Input() compactMode = false;

  showHeaders = true;
  title = this.localeService.localizedTitle;

  constructor(
    private authService: AuthService,
    private layoutService: LayoutService,
    private localeService: LocaleService,
  ) { }

  setFullFrameContent(): void {
    this.layoutService.toggleFullFrameContent(true);
  }

  unsetFullFrameContent(): void {
    this.layoutService.toggleFullFrameContent(false);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
