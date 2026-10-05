import { Component, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSessionService } from './services/user-session.service';
import { delay, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { combineLatest, merge, of } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { LocaleService } from './services/localeService';
import { LayoutService } from './services/layout.service';
import { Title } from '@angular/platform-browser';
import { APPCONFIG } from './config';
import { urlToRedirectTo } from './utils/redirect-to-sub-path-at-init';
import { readAppVersionFromDocument } from 'src/app/utils/app-version';
import { CrashReportingService } from './services/crash-reporting.service';
import { DOCUMENT, Location, AsyncPipe } from '@angular/common';
import { ChunkErrorService } from './services/chunk-error.service';
import { AppVersionCheckService } from './services/app-version-check.service';
import { TopBarComponent } from './containers/top-bar/top-bar.component';
import { LanguageMismatchComponent } from './containers/language-mismatch/language-mismatch.component';
import { ThreadContainerComponent } from './forum/containers/thread-container/thread-container.component';
import { HtmlElLoadedDirective } from './directives/html-el-loaded.directive';
import { LeftPanelComponent } from './containers/left-panel/left-panel.component';
import { Store } from '@ngrx/store';
import { fromForum, isThreadInline } from 'src/app/forum/store';
import { fromObservation } from './store/observation';
import { fromItemContent } from './items/store';
import { isNotNull, isNotNullOrUndefined } from './utils/null-undefined-predicates';
import { canDisplayPlatformLogoInTopBar } from './utils/platform-logo-display';
import { ItemRouter } from './models/routing/item-router';
import { CdkScrollable } from '@angular/cdk/overlay';
import { routeWithNoObservation } from './models/routing/item-route';
import { Dialog } from '@angular/cdk/dialog';
import { FatalErrorModalComponent } from 'src/app/containers/fatal-error-modal/fatal-error-modal.component';
import {
  GroupObservationErrorModalComponent
} from 'src/app/containers/group-observation-error-modal/group-observation-error-modal.component';
import { NewVersionModalComponent } from 'src/app/containers/new-version-modal/new-version-modal.component';
import { ToastMessagesComponent } from 'src/app/ui-components/toast-messages/toast-messages.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'alg-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    LeftPanelComponent,
    TopBarComponent,
    HtmlElLoadedDirective,
    RouterOutlet,
    ThreadContainerComponent,
    LanguageMismatchComponent,
    AsyncPipe,
    CdkScrollable,
    ToastMessagesComponent,
  ]
})
export class AppComponent implements OnInit {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private sessionService = inject(UserSessionService);
  private authService = inject(AuthService);
  private localeService = inject(LocaleService);
  private layoutService = inject(LayoutService);
  private crashReportingService = inject(CrashReportingService);
  private location = inject(Location);
  private document = inject(DOCUMENT);
  private titleService = inject(Title);
  private chunkErrorService = inject(ChunkErrorService);
  private appVersionCheckService = inject(AppVersionCheckService);
  private itemRouter = inject(ItemRouter);
  private config = inject(APPCONFIG);
  private topBarComponent = viewChild(TopBarComponent);

  private dialogService = inject(Dialog);

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
  hideLeftMenuTree$ = this.layoutService.hideLeftMenuTree$;
  searchActive$ = this.layoutService.searchActive$;
  canShowBreadcrumbs$ = this.layoutService.canShowBreadcrumbs$;
  showTopRightControls$ = this.layoutService.showTopRightControls$.pipe(delay(0));
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  isDiscussionVisible$ = this.store.select(fromForum.selectVisible);
  isThreadInline$ = combineLatest([
    this.store.select(fromForum.selectThreadInlineContext),
    this.sessionService.userProfile$,
  ]).pipe(
    map(([ context, userProfile ]) => isThreadInline(context, userProfile.groupId)),
    distinctUntilChanged(),
    // Emit true immediately, but delay false by 300ms so the global panel
    // doesn't flash during quick inline→inline transitions between items.
    switchMap(value => (value ? of(true) : of(false).pipe(delay(300)))),
  );
  scrolled = signal(false);
  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  groupObservationError$ = this.store.select(fromObservation.selectObservationError);

  constructor() {
    const title = this.localeService.currentLang ? this.config.languageSpecificTitles[this.localeService.currentLang.tag] : undefined;
    this.titleService.setTitle(title ?? this.config.defaultTitle);

    // Handle a redirect to sub path which can be used to redirect to a specific page when coming back on the app
    const redirectTo = urlToRedirectTo({ from: this.location.path() });
    if (redirectTo) void this.router.navigateByUrl(redirectTo, { replaceUrl: true });

    // eslint-disable-next-line no-console
    console.log(`App version: ${readAppVersionFromDocument(this.document) ?? 'unknown'}`);

    this.crashReportingService.init();
  }

  ngOnInit(): void {
    // if user changes, navigate back to the root
    this.sessionService.userChanged$.pipe(
      switchMap(() => this.router.navigateByUrl('/')),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.fatalError$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(error =>
      this.dialogService.open(FatalErrorModalComponent, { data: error, disableClose: true, autoFocus: undefined })
    );

    this.appVersionCheckService.newVersionAvailable$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.openNewVersionModal());

    this.groupObservationError$.pipe(
      filter(isNotNullOrUndefined),
      take(1),
      switchMap(error =>
        this.dialogService.open(GroupObservationErrorModalComponent, { data: error, disableClose: true, autoFocus: undefined }).closed
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.onCloseObservationErrorDialog());

    // Dev-only hook so the new-version modal can be previewed from the console via
    // `window.algoreaPreviewNewVersionModal()`. The `typeof window` guard covers non-browser contexts.
    if (!environment.production && typeof window !== 'undefined') {
      (window as unknown as { algoreaPreviewNewVersionModal?: () => void })
        .algoreaPreviewNewVersionModal = (): void => {
          // Avoid stacking disableClose modals when the helper is called repeatedly from the console.
          if (this.dialogService.openDialogs.length) return;
          this.openNewVersionModal();
        };
      this.destroyRef.onDestroy(() => {
        delete (window as { algoreaPreviewNewVersionModal?: () => void }).algoreaPreviewNewVersionModal;
      });
    }
  }

  private openNewVersionModal(): void {
    this.dialogService.open(NewVersionModalComponent, { disableClose: true, autoFocus: undefined });
  }

  onScrollContent(scrollEl: HTMLElement): void {
    const topBarHeight = Number(this.topBarComponent()?.elementRef.nativeElement.clientHeight || 0);
    const pageNavigatorNeighborWidgetRect
      = document.querySelector('#page-navigator-neighbor-widget')?.getBoundingClientRect();
    const gap = pageNavigatorNeighborWidgetRect
      ? ((pageNavigatorNeighborWidgetRect.top + pageNavigatorNeighborWidgetRect.height) + scrollEl.scrollTop) - topBarHeight
      : topBarHeight;
    if (scrollEl.scrollTop > gap && !this.scrolled()) {
      this.scrolled.set(true);
    } else if (scrollEl.scrollTop <= gap && this.scrolled()) {
      this.scrolled.set(false);
    }
  }

  onLoaded(scrollEl: HTMLElement): void {
    scrollEl.addEventListener('scroll', () => {
      this.onScrollContent(scrollEl);
    });
  }

  canDisplayPlatformLogo(
    layout: { hideLeftMenuTree?: boolean | null, searchActive?: boolean | null },
    leftMenuShown: boolean,
  ): boolean {
    return canDisplayPlatformLogoInTopBar({
      leftMenuShown,
      hideLeftMenuTree: !!layout.hideLeftMenuTree,
      searchActive: !!layout.searchActive,
    });
  }

  onCloseObservationErrorDialog(): void {
    this.store.select(fromItemContent.selectActiveContentRoute).pipe(
      take(1),
      filter(isNotNull),
    ).subscribe(route => {
      this.itemRouter.navigateTo(routeWithNoObservation(route));
    });
  }
}
