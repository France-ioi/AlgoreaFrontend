import { Location } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { ActivatedRouteSnapshot, PRIMARY_OUTLET, UrlSegment, UrlSerializer } from '@angular/router';
import { Store } from '@ngrx/store';

import { BehaviorSubject, Subject, combineLatest, distinctUntilChanged } from 'rxjs';
import { debounceTime, map, scan, startWith, switchMap } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { parseItemUrlSegments } from 'src/app/models/routing/item-route-serialization';
import { fromRouter } from 'src/app/store/router';

export interface FullFrameContent {
  active: boolean,
  canToggle: boolean,
  animated: boolean,
}

export enum ContentDisplayType { Default, Show, ShowFullFrame }

// Top-level route paths displayed without the left navigation tree (compact mode).
// These are app-structural pages (not instance content), so unlike `hideLeftMenuTreeOnItemIds`
// they belong in app code rather than in the deployment config. Add a path here (e.g. 'community')
// to render it without the tree. Matched against the first URL segment so the decision is resolved
// synchronously from the URL (no first-paint flicker).
const treelessRoutePaths: string[] = [];

@Injectable({
  providedIn: 'root'
})
export class LayoutService implements OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private store = inject(Store);
  private config = inject(APPCONFIG);
  private location = inject(Location);
  private urlSerializer = inject(UrlSerializer);

  /* state variables used to make decisions */
  private contentDisplayType$ = new BehaviorSubject<ContentDisplayType>(ContentDisplayType.Default);
  private manualMenuToggle$ = new Subject<boolean>();

  /* independant variables */
  private showTopRightControls = new BehaviorSubject(true);
  private canShowLeftMenu = new BehaviorSubject<boolean>(true);
  private canShowBreadcrumbs = new BehaviorSubject<boolean>(true);
  private searchActive = new BehaviorSubject<boolean>(false);

  /* variables to be used by other services and components */
  isNarrowScreen$ = this.breakpointObserver.observe(Breakpoints.XSmall).pipe(
    map(results => results.matches),
    distinctUntilChanged(),
  );
  fullFrameContentDisplayed$ = this.contentDisplayType$.pipe(map(t => t === ContentDisplayType.ShowFullFrame));
  withLeftPaddingContentDisplayed$ = this.contentDisplayType$.pipe(map(t => t === ContentDisplayType.Show));
  showTopRightControls$ = this.showTopRightControls.asObservable();
  canShowLeftMenu$ = this.canShowLeftMenu.asObservable();
  canShowBreadcrumbs$ = this.canShowBreadcrumbs.asObservable();
  searchActive$ = this.searchActive.asObservable().pipe(distinctUntilChanged());
  hideLeftMenuTree$ = this.store.select(fromRouter.selectSegments).pipe(
    // Before the first ROUTER_NAVIGATED the router store has no segments yet. Parse the current
    // URL synchronously so the panel is sized correctly on the very first paint (avoids the
    // full-width -> compact width transition flashing on direct load of a compact-mode page).
    map(segments => segments ?? this.urlSerializer.parse(this.location.path()).root.children[PRIMARY_OUTLET]?.segments ?? []),
    map(segments => this.isTreelessUrl(segments)),
    distinctUntilChanged(),
  );
  /**
   * Left menu: expected behavior
   * (note that in the following, a narrow window as the same behavior as mobile)
   * - cannot show left menu (e.g., using LTI) -> never show the menu
   * - on app launch -> hide the menu on mobile, show otherwise
   * - when reducing the window size to mobile: hide the menu
   * - when enlarging the window size from mobile to non-mobile: show the menu if not showing a full-frame task
   * - when clicking on the show/hide hamburger menu, show/hide the menu
   * - on mobile, when clicking on a task in the left menu, close the menu
   * - on non-mobile, hide the menu when opening a full-frame task (known when the task has been loaded), except if the it was open using
   *   the left menu
   * - otherwise, leave the menu as it is
   * Interesting case to be tested: on mobile, if opening a task via the menu (the menu hides) and closing the menu manually, the menu does
   * not re-hide when it knows it is a full-frame task
   */
  leftMenu$ = combineLatest([
    this.isNarrowScreen$,
    this.canShowLeftMenu,
    this.contentDisplayType$
  ]).pipe(
    debounceTime(0), // as the sources are not independant, prevent some very-transient inconsistent cases
    // each time manualMenuToggle$ emits, emit its (bool) value, otherwise emit `undefined`
    switchMap(values => this.manualMenuToggle$.pipe(
      map<boolean,[ boolean, boolean, ContentDisplayType, boolean|undefined ]>(manualMenuToggle => [ ...values, manualMenuToggle ]),
      startWith<[ boolean, boolean, ContentDisplayType, boolean|undefined ]>([ ...values, undefined ])
    )),
    scan((prev, [ isNarrowScreen, canShowLeftMenu, displayType, manualMenuToggle ], idx) => {
      if (!canShowLeftMenu) return { shown: false, animated: false, isNarrowScreen };
      if (idx === 0) return { shown: !isNarrowScreen, animated: false, isNarrowScreen };
      if (prev.isNarrowScreen !== isNarrowScreen) {
        return { shown: !isNarrowScreen && displayType !== ContentDisplayType.ShowFullFrame, animated: true, isNarrowScreen };
      }
      if (manualMenuToggle !== undefined) return { shown: manualMenuToggle, animated: true, isNarrowScreen };
      if (isNarrowScreen && displayType === ContentDisplayType.Show) {
        return { shown: false, animated: true, isNarrowScreen };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const preventFullFrame = typeof history.state === 'object' && Boolean(history.state?.preventFullFrame);
      if (!preventFullFrame && displayType === ContentDisplayType.ShowFullFrame) {
        return { shown: false, animated: true, isNarrowScreen };
      }
      return { ...prev, isNarrowScreen };
    }, { shown: false, animated: false, isNarrowScreen: false }),
    map(({ shown, animated }) => ({ shown, animated })),
    distinctUntilChanged((x, y) => x.shown === y.shown),
  );

  ngOnDestroy(): void {
    this.contentDisplayType$.complete();
    this.manualMenuToggle$.complete();
    this.showTopRightControls.complete();
    this.canShowLeftMenu.complete();
    this.canShowBreadcrumbs.complete();
    this.searchActive.complete();
  }

  /**
   * Configure layout.
   * The layout is considered not initialized (so not using animation) only until the first call.
   */
  configure({ contentDisplayType, canShowLeftMenu, canShowBreadcrumbs, showTopRightControls }: {
    contentDisplayType?: ContentDisplayType,
    canShowLeftMenu?: boolean,
    canShowBreadcrumbs?: boolean,
    showTopRightControls?: boolean,
  }): void {
    if (contentDisplayType !== undefined) this.contentDisplayType$.next(contentDisplayType);
    if (canShowLeftMenu !== undefined) this.canShowLeftMenu.next(canShowLeftMenu);
    if (canShowBreadcrumbs !== undefined) this.canShowBreadcrumbs.next(canShowBreadcrumbs);
    if (showTopRightControls !== undefined) this.showTopRightControls.next(showTopRightControls);
  }

  toggleLeftMenu(visible: boolean): void {
    this.manualMenuToggle$.next(visible);
  }

  setLeftMenuSearchActive(active: boolean): void {
    this.searchActive.next(active);
  }

  /**
   * Whether the left navigation tree should be hidden (compact mode) for the given URL segments.
   * Combines app-structural tree-less routes with the instance-configured special item ids.
   */
  private isTreelessUrl(segments: UrlSegment[]): boolean {
    if (segments[0] && treelessRoutePaths.includes(segments[0].path)) return true;
    const id = parseItemUrlSegments(segments, this.config.redirects)?.route.id ?? null;
    return id !== null && this.config.hideLeftMenuTreeOnItemIds.includes(id);
  }

}

@Injectable({
  providedIn: 'root'
})
export class DefaultLayoutInitService {
  private layoutService = inject(LayoutService);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    this.layoutService.configure({
      contentDisplayType: route.data['contentDisplayType'] as ContentDisplayType | undefined,
    });
    return true;
  }
}
