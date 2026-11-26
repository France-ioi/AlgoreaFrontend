import { Location } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { ActivatedRouteSnapshot, PRIMARY_OUTLET, UrlSegment, UrlSerializer } from '@angular/router';
import { Store } from '@ngrx/store';

import { BehaviorSubject, Subject, combineLatest, distinctUntilChanged } from 'rxjs';
import { debounceTime, map, scan, startWith, switchMap } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { parseItemUrlSegments } from 'src/app/models/routing/item-route-serialization';
import { fromRouter } from 'src/app/store/router';
import { narrowScreenMediaQuery } from '../utils/layout-breakpoints';

export interface FullFrameContent {
  active: boolean,
  canToggle: boolean,
  animated: boolean,
}

export enum ContentDisplayType { Default, Show, ShowFullFrame }

interface ContentDisplay {
  type: ContentDisplayType,
  /** Identifies the displayed content (e.g. an item id) so menu choices can be scoped to it. */
  contentId?: string,
}

interface LeftMenuState {
  shown: boolean,
  animated: boolean,
  isNarrowScreen: boolean,
  display: ContentDisplay,
  /** Whether the full-frame auto-hide no longer applies to the current content (already done, or overridden by the user). */
  fullFrameHideSettled: boolean,
}

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
  private contentDisplay$ = new BehaviorSubject<ContentDisplay>({ type: ContentDisplayType.Default });
  private manualMenuToggle$ = new Subject<boolean>();

  /* independant variables */
  private showTopRightControls = new BehaviorSubject(true);
  private canShowLeftMenu = new BehaviorSubject<boolean>(true);
  private canShowBreadcrumbs = new BehaviorSubject<boolean>(true);
  private searchActive = new BehaviorSubject<boolean>(false);

  /* variables to be used by other services and components */
  isNarrowScreen$ = this.breakpointObserver.observe(narrowScreenMediaQuery).pipe(
    map(results => results.matches),
    distinctUntilChanged(),
  );
  fullFrameContentDisplayed$ = this.contentDisplay$.pipe(map(d => d.type === ContentDisplayType.ShowFullFrame));
  withLeftPaddingContentDisplayed$ = this.contentDisplay$.pipe(map(d => d.type === ContentDisplayType.Show));
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
   * - when entering the full-frame layout, hide the menu once per content (e.g., per item), except if it was opened using the left menu
   *   or if the user already showed/hid the menu on this content
   * - when leaving the full-frame layout, leave the menu as it is
   * - otherwise, leave the menu as it is
   * Interesting case to be tested: on mobile, if opening a task via the menu (the menu hides) and closing the menu manually, the menu does
   * not re-hide when it knows it is a full-frame task
   */
  leftMenu$ = combineLatest([
    this.isNarrowScreen$,
    this.canShowLeftMenu,
    this.contentDisplay$
  ]).pipe(
    debounceTime(0), // as the sources are not independant, prevent some very-transient inconsistent cases
    // each time manualMenuToggle$ emits, emit its (bool) value, otherwise emit `undefined`
    switchMap(values => this.manualMenuToggle$.pipe(
      map<boolean,[ boolean, boolean, ContentDisplay, boolean|undefined ]>(manualMenuToggle => [ ...values, manualMenuToggle ]),
      startWith<[ boolean, boolean, ContentDisplay, boolean|undefined ]>([ ...values, undefined ])
    )),
    scan((prev: LeftMenuState, [ isNarrowScreen, canShowLeftMenu, display, manualMenuToggle ], idx): LeftMenuState => {
      const sameContent = prev.display.contentId === display.contentId;
      const next = { isNarrowScreen, display, fullFrameHideSettled: sameContent && prev.fullFrameHideSettled };
      const isFullFrame = display.type === ContentDisplayType.ShowFullFrame;
      if (!canShowLeftMenu) return { ...next, shown: false, animated: false };
      if (idx === 0) return { ...next, shown: !isNarrowScreen, animated: false };
      if (prev.isNarrowScreen !== isNarrowScreen) return { ...next, shown: !isNarrowScreen && !isFullFrame, animated: true };
      if (manualMenuToggle !== undefined) return { ...next, shown: manualMenuToggle, animated: true, fullFrameHideSettled: true };
      if (isFullFrame && !next.fullFrameHideSettled) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const preventFullFrame = typeof history.state === 'object' && Boolean(history.state?.preventFullFrame);
        return { ...next, shown: preventFullFrame ? prev.shown : false, animated: true, fullFrameHideSettled: true };
      }
      const leavingFullFrame = sameContent && prev.display.type === ContentDisplayType.ShowFullFrame;
      if (isNarrowScreen && display.type === ContentDisplayType.Show && !leavingFullFrame) {
        return { ...next, shown: false, animated: true };
      }
      return { ...next, shown: prev.shown, animated: prev.animated };
    }, {
      shown: false, animated: false, isNarrowScreen: false, display: { type: ContentDisplayType.Default }, fullFrameHideSettled: false,
    }),
    map(({ shown, animated }) => ({ shown, animated })),
    distinctUntilChanged((x, y) => x.shown === y.shown),
  );

  ngOnDestroy(): void {
    this.contentDisplay$.complete();
    this.manualMenuToggle$.complete();
    this.showTopRightControls.complete();
    this.canShowLeftMenu.complete();
    this.canShowBreadcrumbs.complete();
    this.searchActive.complete();
  }

  /**
   * Configure layout.
   * The layout is considered not initialized (so not using animation) only until the first call.
   * `contentId` goes with `contentDisplayType`: it scopes the full-frame menu auto-hide (and the user's menu choice) to that content.
   */
  configure({ contentDisplayType, contentId, canShowLeftMenu, canShowBreadcrumbs, showTopRightControls }: {
    contentDisplayType?: ContentDisplayType,
    contentId?: string,
    canShowLeftMenu?: boolean,
    canShowBreadcrumbs?: boolean,
    showTopRightControls?: boolean,
  }): void {
    if (contentDisplayType !== undefined) this.contentDisplay$.next({ type: contentDisplayType, contentId });
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
