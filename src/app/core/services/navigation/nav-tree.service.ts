import { combineLatest, merge, Observable, of, OperatorFunction, Subject } from 'rxjs';
import { catchError, delay, distinctUntilChanged, map, mergeScan, shareReplay, startWith } from 'rxjs/operators';
import { isDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { ContentInfo, RoutedContentInfo } from 'src/app/shared/models/content/content-info';
import { mapStateData, mapToFetchState } from 'src/app/shared/operators/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';

export interface NeighborInfo {
  navigateTo: () => void,
}

export interface NavigationNeighbors {
  parent: NeighborInfo|null,
  previous: NeighborInfo|null,
  next: NeighborInfo|null,
}

export abstract class NavTreeService<ContentT extends RoutedContentInfo> {

  private reloadTrigger = new Subject<void>();

  private content$ = this.currentContent.content$.pipe( // only keep those of interest for the current nav tree
    // map those which are not of interest to `undefined`
    map(content => (this.isOfContentType(content) ? content : undefined)),
    distinctUntilChanged(), // remove multiple `undefined`
    startWith(undefined),
    repeatLatestWhen(this.reloadTrigger),
  );
  private children$ = merge(
    // emit `undefined` each time the content change
    this.content$.pipe(
      map(c => c?.route.id),
      distinctUntilChanged(),
      map(() => undefined),
    ),
    this.content$.pipe(
      this.childrenNavData(),
      catchError(() => of(new Error('fetch error'))),
    ),
  );
  state$ = combineLatest([ this.children$, this.content$ ]).pipe(
    mergeScan((prevState: FetchState<NavTreeData>, [ children, content ]) => {
      if (children instanceof Error) return of(errorState(children));

      // CASE 1: the current-content does not match the type of this nav tree (so `content` has been mapped to `undefined`)
      if (!content) {
        // CASE 1A: the menu has already an element displayed -> just deselect what is selected if there was a selection
        if (prevState.isReady) return of(readyState(prevState.data.withNoSelection()));
        // CASE 1B: the menu has nothing displayed yet -> load item root
        else return this.fetchDefaultNav();

      } else {
      // CASE 2: the content type matches the type of this nav tree
        const route = content.route;

        if (prevState.isReady && prevState.data.hasElement(route)) {
          // CASE 2A : the content is among the displayed elements -> either select it if at root or shift the tree "to the left" otherwise
          const prevData = prevState.data;
          let data = prevData.hasLevel1Element(route) ? prevData.withSelection(route.id) : prevData.subNavMenuData(route);
          if (children) data = data.withChildren(route, children);
          data = data.withUpdatedElement(route, el => this.addDetailsToTreeElement(el, content));
          return of(readyState(data));

          // CASE 2B: the content is not among the displayed elements -> fetch all nav
        } else {
          return this.fetchNewNav(content).pipe(
            mapStateData(data => {
              if (children) data = data.withChildren(route, children);
              data = data.withUpdatedElement(route, el => this.addDetailsToTreeElement(el, content));
              return data;
            })
          );
        }
      }
    }, fetchingState<NavTreeData>() /* the switchScan seed */, 1 /* concurrency = 1 so that we can always use the last state*/),
    delay(0),
    shareReplay(1),
  );

  /**
   * In some cases (ie LTI), the user visits the app only to work on an exercise, chapter or task and then returns to the original platform.
   * For that purpose, we want to be able to restrict in-app navigation to a specific chapter.
   * This is done by hiding the left menu and allowing only neighbor navigation while disabling others.
   * When this variable is null, no restriction is applied.
   * When it is populated with an element id, the neighbor navigation will only be restricted to its descendants _not including self_.
   */
  navigationNeighborsRestrictedToDescendantOfElementId: string | null = null;
  navigationNeighbors$: Observable<FetchState<NavigationNeighbors|undefined>> = this.state$.pipe(
    mapStateData(navData => {
      if (!navData.selectedElementId) return undefined;
      const idx = navData.elements.findIndex(e => e.id === navData.selectedElementId);
      if (idx < 0) return undefined;

      const parent = navData.parent;
      if (parent && navData.pathToElements.length < 1) throw new Error('Unexpected: empty path with a parent');
      const prev = navData.elements[idx-1];
      const next = navData.elements[idx+1];

      return {
        parent: parent && parent.id !== this.navigationNeighborsRestrictedToDescendantOfElementId
          ? { navigateTo: (): void => parent.navigateTo(navData.pathToElements.slice(0,-1)) }
          : null,
        previous: prev ? { navigateTo: (): void => prev.navigateTo(navData.pathToElements) } : null,
        next: next ? { navigateTo: (): void => next.navigateTo(navData.pathToElements) } : null,
      };
    }),
  );

  constructor(private currentContent: CurrentContentService) {}

  /**
   * Return whether the given content info has the type expected in the nav tree
   */
  protected abstract isOfContentType(content: ContentInfo|null): content is ContentT;

  /**
   * Operator which emit the children of a content stream
   */
  protected abstract childrenNavData(): OperatorFunction<ContentT|undefined,NavTreeElement[]>;

  /**
   * Re-play the last change
   */
  retry(): void {
    this.reloadTrigger.next();
  }

  protected abstract addDetailsToTreeElement(treeElement: NavTreeElement, contentInfo: ContentT): NavTreeElement;
  protected abstract fetchRootTreeData(): Observable<NavTreeElement[]>;
  protected abstract fetchNavDataFromChild(id: string, child: ContentT): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }>;

  private fetchDefaultNav(): Observable<FetchState<NavTreeData>> {
    return this.fetchRootTreeData().pipe(
      map(elements => new NavTreeData(elements, [], undefined, undefined)),
      mapToFetchState(),
    );
  }

  private fetchNewNav(content: ContentT): Observable<FetchState<NavTreeData>> {
    const route = content.route;
    const parentId = route.path[route.path.length-1];
    if (isDefined(parentId)) {
      return this.fetchNavDataFromChild(parentId, content).pipe(
        map(data => new NavTreeData(data.elements, route.path, route.id, data.parent)),
        mapToFetchState(),
      );
    } else {
      return this.fetchRootTreeData().pipe(
        map(items => new NavTreeData(items, route.path, route.id)),
        mapToFetchState(),
      );
    }
  }

}
