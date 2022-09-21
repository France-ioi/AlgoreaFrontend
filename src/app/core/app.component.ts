import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UserSessionService } from '../shared/services/user-session.service';
import { delay, switchMap, tap } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { ModeAction, ModeService } from '../shared/services/mode.service';
import { LocaleService } from './services/localeService';
import { LayoutService } from '../shared/services/layout.service';
import { Title } from '@angular/platform-browser';
import { appConfig } from '../shared/helpers/config';
import { urlToRedirectTo } from '../shared/helpers/redirect-to-sub-path-at-init';
import { GroupWatchingService } from './services/group-watching.service';
import { version } from 'src/version';
import { CrashReportingService } from './services/crash-reporting.service';
import { Location } from '@angular/common';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {

  // the delay(0) is used to prevent the UI to update itself (when the content is loaded) (ExpressionChangedAfterItHasBeenCheckedError)
  readonly currentMode$ = this.modeService.mode$.asObservable().pipe(delay(0));
  fatalError$ = merge(
    this.authService.failure$,
    this.sessionService.userProfileError$,
    this.localeService.currentLangError$,
  ).pipe(
    // eslint-disable-next-line no-console
    tap(err => console.error('fatal:', err))
  );

  fullFrame$ = this.layoutService.fullFrame$.pipe(delay(0));
  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  scrolled = false;
  isWatching$ = this.groupWatchingService.isWatching$;
  watchedGroupError$ = this.groupWatchingService.watchedGroupError$;
  showWatchedGroupErrorDialog = true;

  private subscription?: Subscription;

  constructor(
    private router: Router,
    private sessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private authService: AuthService,
    private modeService: ModeService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
    private crashReportingService: CrashReportingService,
    private location: Location,
    private titleService: Title,
    private ngZone: NgZone,
    private renderer: Renderer2,
    private el: ElementRef,
  ) {
    const title = appConfig.languageSpecificTitles && this.localeService.currentLang ?
      appConfig.languageSpecificTitles[this.localeService.currentLang.tag] : undefined;
    this.titleService.setTitle(title ?? appConfig.defaultTitle);

    // Temp hack during the hash to non-hash routing transition. Redirect "#/abc/efg" to "/abc/efg"
    const hashPath = window.location.hash.slice(1); // omit leading "#"
    if (hashPath.length && hashPath.charAt(0) === '/') void this.router.navigateByUrl(hashPath, { replaceUrl: true });

    // Handle a redirect to sub path which can be used to redirect to a specific page when coming back on the app
    const redirectTo = urlToRedirectTo({ from: this.location.path() });
    if (redirectTo) void this.router.navigateByUrl(redirectTo, { replaceUrl: true });

    if (appConfig.theme !== 'default') {
      this.renderer.setAttribute(this.el.nativeElement, 'data-theme', `${appConfig.theme}`);
    }
    // eslint-disable-next-line no-console
    console.log(`App version: ${version}`);

    this.crashReportingService.init();
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

  closeWatchGroupErrorDialog(): void {
    this.showWatchedGroupErrorDialog = false;
    this.groupWatchingService.stopWatching();
  }

}
