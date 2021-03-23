import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';

@Component({
  selector: 'alg-left-header',
  templateUrl: './left-header.component.html',
  styleUrls: [ './left-header.component.scss' ]
})
export class LeftHeaderComponent {

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
