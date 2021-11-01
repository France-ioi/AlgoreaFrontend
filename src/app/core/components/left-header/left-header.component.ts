import { Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
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
  title = this.titleService.getTitle();

  constructor(
    private authService: AuthService,
    private layoutService: LayoutService,
    private titleService: Title,
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
