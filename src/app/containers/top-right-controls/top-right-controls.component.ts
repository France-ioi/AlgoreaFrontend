import { Component, Input, signal } from '@angular/core';
import { delay } from 'rxjs/operators';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { LanguagePickerComponent } from '../language-picker/language-picker.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { TopRightMenuComponent } from '../top-right-menu/top-right-menu.component';
import { NgClass } from '@angular/common';
import { LetDirective } from '@ngrx/component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-top-right-controls',
  templateUrl: './top-right-controls.component.html',
  styleUrls: [ './top-right-controls.component.scss' ],
  imports: [ LetDirective, NgClass, TopRightMenuComponent, LanguagePickerComponent, ButtonIconComponent, NotificationBellComponent ]
})
export class TopRightControlsComponent{

  @Input() drawLeftBorder = true;
  @Input() topRightMenuStyleClass?: string;
  session$ = this.sessionService.session$.pipe(delay(0));
  readonly languages = this.localeService.languages;

  isLoginButtonClicked = signal(false);

  constructor(
    private sessionService: UserSessionService,
    private localeService: LocaleService,
  ) { }

  login(): void {
    this.isLoginButtonClicked.set(true);
    this.sessionService.login();
  }

}
