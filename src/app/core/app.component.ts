import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { UserSessionService } from '../shared/services/user-session.service';
import { delay, switchMap } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { ModeAction, ModeService } from '../shared/services/mode.service';
import { LocaleService } from './services/localeService';
import { LayoutService } from '../shared/services/layout.service';
import { Title } from '@angular/platform-browser';
import { appConfig } from '../shared/helpers/config';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {

  // the delay(0) is used to prevent the UI to update itself (when the content is loaded) (ExpressionChangedAfterItHasBeenCheckedError)
  readonly currentMode$ = this.modeService.mode$.asObservable().pipe(delay(10));
  fatalError$ = merge(
    this.authService.failure$,
    this.sessionService.userProfileError$,
    this.localeService.currentLangError$,
  );

  fullFrameContent$ = this.layoutService.fullFrameContent$.pipe(delay(0));
  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  contentFooter$ = this.layoutService.contentFooter$.pipe(delay(0));
  scrolled = false;

  private subscription?: Subscription;

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
    private authService: AuthService,
    private modeService: ModeService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
    private titleService: Title,
    private ngZone: NgZone,
  ) {
    const title = appConfig.languageSpecificTitles && this.localeService.currentLang ?
      appConfig.languageSpecificTitles[this.localeService.currentLang.tag] : undefined;
    this.titleService.setTitle(title ?? appConfig.defaultTitle);
  }

  ngOnInit(): void {
    // if user changes, navigate back to the root
    this.subscription = this.sessionService.userChanged$.pipe(
      switchMap(() => this.router.navigateByUrl('/')),
    ).subscribe();

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', () => {
        this.onScrollContent();
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onScrollContent(): void {
    if (window.pageYOffset > 40 && !this.scrolled) {
      this.ngZone.run(() => {
        this.scrolled = true;
      });
    } else if (window.pageYOffset <= 40 && this.scrolled) {
      this.ngZone.run(() => {
        this.scrolled = false;
      });
    }
  }

  onEditCancel() : void{
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }

}
