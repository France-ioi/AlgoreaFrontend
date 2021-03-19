import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';

@Component({
  selector: 'alg-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: [ './top-nav.component.scss' ]
})
export class TopNavComponent {

  @Input() compactMode = false;

  @Output() displayLeftMenu = new EventEmitter<boolean>();
  @Output() displayHeaders = new EventEmitter<boolean>();

  showHeaders = true;

  constructor(
    private authService: AuthService
  ) { }

  hideLeftMenu(): void {
    this.displayLeftMenu.emit(false);
  }

  showLeftMenu(): void {
    this.displayLeftMenu.emit(true);
  }

  toggleHeadersDisplay(): void {
    this.showHeaders = !this.showHeaders;
    this.displayHeaders.emit(this.showHeaders);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
