import { Component, Input } from '@angular/core';
import { delay } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { ButtonModule } from 'primeng/button';
import { LanguagePickerComponent } from '../language-picker/language-picker.component';
import { TopRightMenuComponent } from '../top-right-menu/top-right-menu.component';
import { NgClass, NgIf } from '@angular/common';
import { LetDirective } from '@ngrx/component';

@Component({
  selector: 'alg-top-right-controls',
  templateUrl: './top-right-controls.component.html',
  styleUrls: [ './top-right-controls.component.scss' ],
  standalone: true,
  imports: [ LetDirective, NgClass, NgIf, TopRightMenuComponent, LanguagePickerComponent, ButtonModule ]
})
export class TopRightControlsComponent{

  @Input() drawLeftBorder = true;
  @Input() topRightMenuStyleClass?: string;
  @Input() languagePickerStyleClass?: string;
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
