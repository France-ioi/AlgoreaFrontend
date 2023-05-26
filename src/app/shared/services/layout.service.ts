import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, CanActivate } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, concat, distinctUntilChanged } from 'rxjs';
import { debounceTime, map, scan, startWith, switchMap } from 'rxjs/operators';

export interface FullFrameContent {
  active: boolean,
  canToggle: boolean,
  animated: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService implements OnDestroy {

  /* state variables used to make decisions */
  private fullFrameContentDisplayed = new BehaviorSubject<boolean>(false);
  private isNarrowScreen$ = this.breakpointObserver.observe(Breakpoints.XSmall).pipe(
    map(results => results.matches),
    distinctUntilChanged(),
  );
  private manualMenuToggle$ = new Subject<boolean>();
  private leftMenuNavigation$ = this.activatedRoute.data.pipe(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    map(() => Boolean(typeof history.state === 'object' && history.state?.preventFullFrame)),
    distinctUntilChanged(),
  );

  /* independant variables */
  private showTopRightControls = new BehaviorSubject(true);
  private canShowLeftMenu = new BehaviorSubject<boolean>(true);

  /* variables to be used by other services and components */
  fullFrameContentDisplayed$ = this.fullFrameContentDisplayed.asObservable();
  showTopRightControls$ = this.showTopRightControls.asObservable();
  canShowLeftMenu$ = this.canShowLeftMenu.asObservable();
  leftMenu$ = combineLatest([
    this.isNarrowScreen$,
    this.leftMenuNavigation$,
    this.canShowLeftMenu,
    this.fullFrameContentDisplayed$
  ]).pipe(
    debounceTime(0), // as the sources are not independant, prevent some very-transient inconsistent cases
    // each time manualMenuToggle$ emits, emit its (bool) value, otherwise emit `undefined`
    switchMap(values => concat(this.manualMenuToggle$, this.fullFrameContentDisplayed$.pipe(map(() => true))).pipe(
      map(manualMenuToggle => [ ...values, manualMenuToggle ]),
      startWith([ ...values, undefined ])
    )),
    scan((prev, [ isNarrowScreen, leftMenuNavigation, canShowLeftMenu, isFullFrameContent, manualMenuToggle ], idx) => {
      if (!canShowLeftMenu) return { shown: false, animated: false };
      if (idx === 0) return { shown: !isNarrowScreen, animated: false };
      if (manualMenuToggle !== undefined) return { shown: manualMenuToggle, animated: true };
      if (isFullFrameContent && !leftMenuNavigation) return { shown: false, animated: true };
      return prev;
    }, { shown: false, animated: false }),
    distinctUntilChanged((x, y) => x.shown === y.shown),
  );

  constructor(
    private activatedRoute: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
  ){}

  ngOnDestroy(): void {
    this.fullFrameContentDisplayed.complete();
    this.manualMenuToggle$.complete();
    this.showTopRightControls.complete();
    this.canShowLeftMenu.complete();
  }

  /**
   * Configure layout.
   * The layout is considered not initialized (so not using animation) only until the first call.
   */
  configure({ fullFrameContent, canShowLeftMenu, showTopRightControls }: {
    fullFrameContent?: boolean,
    canShowLeftMenu?: boolean,
    showTopRightControls?: boolean,
  }): void {
    if (fullFrameContent !== undefined) this.fullFrameContentDisplayed.next(fullFrameContent);
    if (canShowLeftMenu !== undefined) this.canShowLeftMenu.next(canShowLeftMenu);
    if (showTopRightControls !== undefined) this.showTopRightControls.next(showTopRightControls);
  }

  toggleLeftMenu(visible: boolean): void {
    this.manualMenuToggle$.next(visible);
  }

}

@Injectable({
  providedIn: 'root'
})
export class DefaultLayoutInitService implements CanActivate {

  constructor(
    private layoutService: LayoutService
  ) {}

  /** just init the default layout */
  canActivate(): boolean {
    this.layoutService.configure({});
    return true;
  }
}
