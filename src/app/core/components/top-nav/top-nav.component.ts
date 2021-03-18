import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AuthService } from 'src/app/shared/auth/auth.service';
import { UserSession } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: [ './top-nav.component.scss' ]
})
export class TopNavComponent {

  @Input() collapsed = false;
  @Input() compactMode = false;
  @Input() folded = false;
  @Input() session?: UserSession;

  @Output() collapse = new EventEmitter<boolean>();
  @Output() fold = new EventEmitter<boolean>();

  constructor(
    private authService: AuthService
  ) { }

  onCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapse.emit(this.collapsed);
  }

  onFold(): void {
    this.folded = !this.folded;
    this.fold.emit(this.folded);
  }

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
