import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject, Subject, combineLatest, distinctUntilChanged } from 'rxjs';
import { debounceTime, map, scan, startWith, switchMap } from 'rxjs/operators';

export interface FullFrameContent {
  active: boolean,
  canToggle: boolean,
  animated: boolean,
}

export enum ContentDisplayType { Default, Show, ShowFullFrame }

@Injectable({
  providedIn: 'root'
})
export class LayoutService implements OnDestroy {

  /* state variables used to make decisions */
  private contentDisplayType$ = new BehaviorSubject<ContentDisplayType>(ContentDisplayType.Default);
  private manualMenuToggle$ = new Subject<boolean>();

  /* independant variables */
  private showTopRightControls = new BehaviorSubject(true);
  private canShowLeftMenu = new BehaviorSubject<boolean>(true);
  private canShowBreadcrumbs = new BehaviorSubject<boolean>(true);

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

  constructor(
    private breakpointObserver: BreakpointObserver,
  ){}

  ngOnDestroy(): void {
    this.contentDisplayType$.complete();
    this.manualMenuToggle$.complete();
    this.showTopRightControls.complete();
    this.canShowLeftMenu.complete();
    this.canShowBreadcrumbs.complete();
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

}

@Injectable({
  providedIn: 'root'
})
export class DefaultLayoutInitService {

  constructor(
    private layoutService: LayoutService
  ) {}

  /** just init the default layout */
  canActivate(): boolean {
    this.layoutService.configure({});
    return true;
  }
}
