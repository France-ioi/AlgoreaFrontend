import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { UserSessionService } from '../shared/services/user-session.service';
import { delay, switchMap, tap } from 'rxjs/operators';
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
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { DiscussionService } from '../modules/item/services/discussion.service';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(TopBarComponent) topBarComponent?: TopBarComponent;

  fatalError$ = merge(
    this.authService.failure$,
    this.sessionService.userProfileError$,
    this.localeService.currentLangError$,
    this.chunkErrorService.error$,
  ).pipe(
    // eslint-disable-next-line no-console
    tap(err => console.error('fatal:', err))
  );

  leftMenu$ = this.layoutService.leftMenu$;
  fullFrameContentDisplayed$ = this.layoutService.fullFrameContentDisplayed$;
  canShowLeftMenu$ = this.layoutService.canShowLeftMenu$;
  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  threadState$ = this.discussionService.state$;
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
    private discussionService: DiscussionService,
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
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onScrollContent(scrollEl: HTMLElement): void {
    const topBarHeight = Number(this.topBarComponent?.elementRef.nativeElement.clientHeight || 0);
    const pageNavigatorNeighborWidgetRect
      = document.querySelector('#page-navigator-neighbor-widget')?.getBoundingClientRect();
    const gap = pageNavigatorNeighborWidgetRect
      ? ((pageNavigatorNeighborWidgetRect.top + pageNavigatorNeighborWidgetRect.height) + scrollEl.scrollTop) - topBarHeight
      : topBarHeight;
    if (scrollEl.scrollTop > gap && !this.scrolled) {
      this.ngZone.run(() => {
        this.scrolled = true;
      });
    } else if (scrollEl.scrollTop <= gap && this.scrolled) {
      this.ngZone.run(() => {
        this.scrolled = false;
      });
    }
  }

  onLoaded(scrollEl: HTMLElement): void {
    this.ngZone.runOutsideAngular(() => {
      scrollEl.addEventListener('scroll', () => {
        this.onScrollContent(scrollEl);
      });
    });
  }

  closeWatchGroupErrorDialog(): void {
    this.showWatchedGroupErrorDialog = false;
    this.groupWatchingService.stopWatching();
  }

  onRefresh(): void {
    window.location.reload();
  }

}
