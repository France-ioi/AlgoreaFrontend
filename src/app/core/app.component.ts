import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UserSessionService } from '../shared/services/user-session.service';
import { delay, map, switchMap, tap } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { LocaleService } from './services/localeService';
import { LayoutService } from '../shared/services/layout.service';
import { Title } from '@angular/platform-browser';
import { appConfig } from '../shared/helpers/config';
import { urlToRedirectTo } from '../shared/helpers/redirect-to-sub-path-at-init';
import { GroupWatchingService } from './services/group-watching.service';
import { version } from 'src/version';
import { CrashReportingService } from './services/crash-reporting.service';
import { Location } from '@angular/common';
import { ChunkErrorService } from './services/chunk-error.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {

  fatalError$ = merge(
    this.authService.failure$,
    this.sessionService.userProfileError$,
    this.localeService.currentLangError$,
    this.chunkErrorService.error$,
  ).pipe(
    // eslint-disable-next-line no-console
    tap(err => console.error('fatal:', err))
  );

  fullFrame$ = this.layoutService.fullFrame$.pipe(delay(0));
  isMobile$ = this.breakpointObserver.observe(Breakpoints.HandsetPortrait).pipe(map(results => results.matches));
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
    private localeService: LocaleService,
    private layoutService: LayoutService,
    private crashReportingService: CrashReportingService,
    private location: Location,
    private titleService: Title,
    private ngZone: NgZone,
    private renderer: Renderer2,
    private el: ElementRef,
    private chunkErrorService: ChunkErrorService,
    private breakpointObserver: BreakpointObserver,
  ) {
    const title = appConfig.languageSpecificTitles && this.localeService.currentLang ?
      appConfig.languageSpecificTitles[this.localeService.currentLang.tag] : undefined;
    this.titleService.setTitle(title ?? appConfig.defaultTitle);

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
    if (window.scrollY > 40 && !this.scrolled) {
      this.ngZone.run(() => {
        this.scrolled = true;
      });
    } else if (window.scrollY <= 40 && this.scrolled) {
      this.ngZone.run(() => {
        this.scrolled = false;
      });
    }
  }

  closeWatchGroupErrorDialog(): void {
    this.showWatchedGroupErrorDialog = false;
    this.groupWatchingService.stopWatching();
  }

  onRefresh(): void {
    window.location.reload();
  }

}
