import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserSessionService } from '../shared/services/user-session.service';
import { delay, switchMap } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { ModeService } from '../shared/services/mode.service';
import { LocaleService } from './services/localeService';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {

  // the delay(0) is used to prevent the UI to update itself (when the content is loaded) (ExpressionChangedAfterItHasBeenCheckedError)
  readonly currentMode$ = this.modeService.mode$.asObservable().pipe(delay(0));
  session$ = this.sessionService.session$.pipe(delay(0));
  fatalError$ = merge(
    this.authService.failure$,
    this.sessionService.userProfileError$,
    this.localeService.currentLangError$,
  );

  leftMenuDisplayed = true;
  headersDisplayed = true;

  private subscription?: Subscription;

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
    private authService: AuthService,
    private modeService: ModeService,
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    // if user changes, navigate back to the root
    this.subscription = this.sessionService.userChanged$.pipe(
      switchMap(() => this.router.navigateByUrl('/')),
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleLeftMenuDisplay(shown: boolean): void {
    this.leftMenuDisplayed = shown;
    if (shown) this.headersDisplayed = true;
  }

  toggleHeadersDisplay(shown: boolean): void {
    this.headersDisplayed = shown;
  }

}
