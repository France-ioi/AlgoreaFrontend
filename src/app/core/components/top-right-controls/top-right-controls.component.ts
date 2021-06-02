import { Component, Input } from '@angular/core';
import { delay } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { LocaleService } from '../../services/localeService';

@Component({
  selector: 'alg-top-right-controls',
  templateUrl: './top-right-controls.component.html',
  styleUrls: [ './top-right-controls.component.scss' ]
})
export class TopRightControlsComponent{

  @Input() drawLeftBorder = true;
  session$ = this.sessionService.session$.pipe(delay(0));
  readonly languages = this.localeService.languages;

  constructor(
    private sessionService: UserSessionService,
    private localeService: LocaleService,
  ) { }

  login(): void {
    this.sessionService.login();
  }

}
