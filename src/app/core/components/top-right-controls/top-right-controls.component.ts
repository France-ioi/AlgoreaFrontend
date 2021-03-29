import { Component, Input } from '@angular/core';
import { delay } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-top-right-controls',
  templateUrl: './top-right-controls.component.html',
  styleUrls: [ './top-right-controls.component.scss' ]
})
export class TopRightControlsComponent{

  @Input() drawLeftBorder = true;
  session$ = this.sessionService.session$.pipe(delay(0));

  constructor(
    private sessionService: UserSessionService,
  ) { }

  login(): void {
    this.sessionService.login();
  }

  logout(): void {
    this.sessionService.logout();
  }

}
