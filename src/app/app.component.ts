import { Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { UserSessionService } from './services/user-session.service';
import { delay, switchMap, tap } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { LocaleService } from './services/localeService';
import { LayoutService } from './services/layout.service';
import { Title } from '@angular/platform-browser';
import { APPCONFIG } from './app.config';
import { inject } from '@angular/core';
import { urlToRedirectTo } from './utils/redirect-to-sub-path-at-init';
import { version } from 'src/version';
import { CrashReportingService } from './services/crash-reporting.service';
import { Location, NgIf, NgClass, AsyncPipe } from '@angular/common';
import { ChunkErrorService } from './services/chunk-error.service';
import { TopBarComponent } from './containers/top-bar/top-bar.component';
import { SharedModule } from 'primeng/api';
import { LanguageMismatchComponent } from './containers/language-mismatch/language-mismatch.component';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ThreadContainerComponent } from './forum/containers/thread-container/thread-container.component';
import { HtmlElLoadedDirective } from './directives/html-el-loaded.directive';
import { LetDirective } from '@ngrx/component';
import { LeftMenuComponent } from './containers/left-menu/left-menu.component';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { fromObservation } from './store/observation';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    LeftMenuComponent,
    LetDirective,
    TopBarComponent,
    HtmlElLoadedDirective,
    RouterOutlet,
    ThreadContainerComponent,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    LanguageMismatchComponent,
    SharedModule,
    AsyncPipe,
    ButtonComponent,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  private config = inject(APPCONFIG);
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
  withLeftPaddingContentDisplayed$ = this.layoutService.withLeftPaddingContentDisplayed$;
  canShowLeftMenu$ = this.layoutService.canShowLeftMenu$;
  canShowBreadcrumbs$ = this.layoutService.canShowBreadcrumbs$;
  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  isDiscussionVisible$ = this.store.select(fromForum.selectVisible);
  scrolled = false;
  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  groupObservationError$ = this.store.select(fromObservation.selectObservationError);
  showObservationErrorDialog = true;

  private subscription?: Subscription;

  constructor(
    private store: Store,
    private router: Router,
    private sessionService: UserSessionService,
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
  ) {
    const title = this.localeService.currentLang ? this.config.languageSpecificTitles[this.localeService.currentLang.tag] : undefined;
    this.titleService.setTitle(title ?? this.config.defaultTitle);

    // Handle a redirect to sub path which can be used to redirect to a specific page when coming back on the app
    const redirectTo = urlToRedirectTo({ from: this.location.path() });
    if (redirectTo) void this.router.navigateByUrl(redirectTo, { replaceUrl: true });

    if (this.config.theme !== 'default') {
      this.renderer.setAttribute(this.el.nativeElement, 'data-theme', `${this.config.theme}`);
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

  closeObservationErrorDialog(): void {
    this.showObservationErrorDialog = false;
    this.store.dispatch(fromObservation.errorModalActions.disableObservation());
  }

  onRefresh(): void {
    window.location.reload();
  }

}
