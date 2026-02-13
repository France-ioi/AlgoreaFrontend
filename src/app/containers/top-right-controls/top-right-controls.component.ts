import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { delay, filter, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { LanguagePickerComponent } from '../language-picker/language-picker.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { TopRightMenuComponent } from '../top-right-menu/top-right-menu.component';
import { NgClass } from '@angular/common';
import { LetDirective } from '@ngrx/component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { APPCONFIG } from 'src/app/config';

@Component({
  selector: 'alg-top-right-controls',
  templateUrl: './top-right-controls.component.html',
  styleUrls: [ './top-right-controls.component.scss' ],
  imports: [ LetDirective, NgClass, TopRightMenuComponent, LanguagePickerComponent, ButtonIconComponent, NotificationBellComponent ]
})
export class TopRightControlsComponent implements OnInit {
  private sessionService = inject(UserSessionService);
  private localeService = inject(LocaleService);
  private config = inject(APPCONFIG);
  private destroyRef = inject(DestroyRef);

  @Input() drawLeftBorder = true;
  @Input() topRightMenuStyleClass?: string;
  session$ = this.sessionService.session$.pipe(delay(0));
  readonly languages = this.localeService.languages;
  readonly enableNotifications = this.config.featureFlags.enableNotifications;

  isLoginButtonClicked = signal(false);

  ngOnInit(): void {
    // Reset login button state when the page is restored from back/forward cache
    fromEvent<PageTransitionEvent>(window, 'pageshow').pipe(
      filter(event => event.persisted),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.isLoginButtonClicked.set(false);
    });
  }

  login(): void {
    this.isLoginButtonClicked.set(true);
    this.sessionService.login();
  }

}
