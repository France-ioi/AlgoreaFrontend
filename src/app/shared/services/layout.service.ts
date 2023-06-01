import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, OnDestroy } from '@angular/core';
import { CanActivate } from '@angular/router';
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

  /* variables to be used by other services and components */
  isNarrowScreen$ = this.breakpointObserver.observe(Breakpoints.XSmall).pipe(
    map(results => results.matches),
    distinctUntilChanged(),
  );
  fullFrameContentDisplayed$ = this.contentDisplayType$.pipe(map(t => t === ContentDisplayType.ShowFullFrame));
  showTopRightControls$ = this.showTopRightControls.asObservable();
  canShowLeftMenu$ = this.canShowLeftMenu.asObservable();
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
      if (displayType === ContentDisplayType.ShowFullFrame || (isNarrowScreen && displayType === ContentDisplayType.Show)) {
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
  }

  /**
   * Configure layout.
   * The layout is considered not initialized (so not using animation) only until the first call.
   */
  configure({ contentDisplayType, canShowLeftMenu, showTopRightControls }: {
    contentDisplayType?: ContentDisplayType,
    canShowLeftMenu?: boolean,
    showTopRightControls?: boolean,
  }): void {
    if (contentDisplayType !== undefined) this.contentDisplayType$.next(contentDisplayType);
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
