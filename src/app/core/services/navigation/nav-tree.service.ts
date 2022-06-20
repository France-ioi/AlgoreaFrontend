import { Observable, of, Subject } from 'rxjs';
import { delay, distinctUntilChanged, map, switchMap, mergeScan, shareReplay, startWith, scan } from 'rxjs/operators';
import { isDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
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

  state$ = this.currentContent.content$.pipe(

    /**
     * PART 1 - PREPARING THE CONTENT
     * Only keep those of interest for the current nav tree
     */
    map(content => (this.isOfContentType(content) ? content : undefined)), // map those which are not of interest to `undefined`
    distinctUntilChanged(), // remove multiple `undefined`
    startWith(undefined),
    // emits the content+reload:false immediately, emit content+reload:true when/if `reloadTrigger` emits
    switchMap(content => this.reloadTrigger.pipe(map(() => ({ content, reload: true })), startWith({ content, reload: false }))),

    /**
     * PART 2 - ADDING CHILDREN
     * For each content, "attach his children" (if any).
     * Attaching the children is combining each content with the fetching of its children, which goes through a fetching state, emitted
     * immediately, and a ready/error state. Difficulties/constraints are that:
     * - for each emitted (content, children state, reload) by this "PART 2", the children state should correspond to the content at any
     *   moment
     * - these 2 successive children fetching states have to end up in 2 emissions of (content, children state, reload), not more, not less
     * - the content may not have the required information to fetch its children initially, this information may come up with an update
     * - the content gets updated, so it is emitted several time with more data... when children fetching has been started, it has not to
     *   be cancelled by the next content update (as a classic `switchMap` would do)
     *
     * Cases to be tested or, at least, well thought out (for the brave developer who wants to try to do a change):
     * - `undefined` content while:
     *    - previous content had children not fetchable
     *    - previous content had children fetching ongoing or done with error/ready (with data)
     * - new (changed) content whose children are not fetchable while:
     *    - previous content was `undefined`
     *    - previous content had children not fetchable
     *    - previous content had children fetching ongoing or done with error/ready (with data)
     * - new (changed) content whose children are fetchable while:
     *    - previous content was `undefined`
     *    - previous content had children not fetchable
     *    - previous content had children fetching ongoing or done with error/ready (with data)
     * - same content whose children are not fetchable while:
     *    - same content had previously children not fetchable
     *    - same content had previously children fetching ongoing or done with error/ready (rare case which should just not bug everything)
     * - same content whose children are fetchable while:
     *    - same content had previously children not fetchable
     *    - same content had previously children fetching ongoing or done with error/ready (with data)
     * We have to make sure the behavior is correct when the children fetching response arrives after attempts, and the other way around
     */

    // First, we generate (content, observable-for-fetching-children, reload) using a `scan` as we need to be able to reuse/share the
    // observable from the previous emission (so without cancelling it).
    scan((
      prev: { content: ContentT|undefined, childrenState$: Observable<FetchState<NavTreeElement[]> | undefined>, reload: boolean },
      { content, reload }
    ) => {
      // CASE a: there is no content selected, or it may not have children, or it miss data to fetch its children -> `undefined` state
      if (!content || !this.canFetchChildren(content)) return { content, childrenState$: of(undefined), reload };

      // CASE b: the current content has children to be fetched while the previous one did not or was related to another content,
      //         or reload case -> create a new fetching for children
      //         (the `shareReplay(1)` is important as it allows a future emission to reuse this fetch state just keeping its latest value)
      if (!prev.content || content.route.id !== prev.content.route.id || !this.canFetchChildren(prev.content) || reload)
        return { content, childrenState$: this.fetchChildren(content).pipe(mapToFetchState(), shareReplay(1)), reload };

      // CASE c: the previous emission had already created a fetching state (possibly still fetching, or ready/error) that can be reuse here
      return { content, childrenState$: prev.childrenState$, reload };
    }, ({ content: undefined, childrenState$: of(undefined), reload: false })),
    // Here we "play" the observable-for-fetching-children in a `switchMap` so that the next part can use the children state.
    switchMap(({ content, childrenState$, reload }) => childrenState$.pipe(
      // Build (content, children state, reload) based on fetching. Only send reload if the first state change
      map((childrenState, idx) => ({ content, childrenState, reload: idx === 0 ? reload : false }))
    )),

    /**
     * PART 3 - Apply the current (content, children state, reload) on the previous version of the nav tree
     */
    mergeScan((prevState: FetchState<NavTreeData>, { content, childrenState, reload }) => {
      // CASE 1: the current-content does not match the type of this nav tree (so `content` has been mapped to `undefined`)
      if (!content) {
        // CASE 1A: the menu has already an element displayed -> just deselect what is selected if there was a selection
        if (prevState.isReady) return of(readyState(prevState.data.withNoSelection()));
        // CASE 1B: the menu has nothing displayed yet -> load item root
        else return this.fetchDefaultNav();

      } else {
      // CASE 2: the content type matches the type of this nav tree
        const route = content.route;

        // CASE 2A: reload or the content is not among the displayed elements -> fetch all nav
        if (reload || !prevState.isReady || !prevState.data.hasElement(route)) {
          return this.fetchNewNav(content).pipe(
            mapStateData(data => {
              if (childrenState?.isReady) data = data.withChildren(route, childrenState.data);
              data = data.withUpdatedElement(route, el => this.addDetailsToTreeElement(el, content));
              return data;
            })
          );

        // CASE 2B : the content is among the displayed elements -> either select it if at root or shift the tree "to the left" otherwise
        } else {
          const prevData = prevState.data;
          let data = prevData.hasLevel1Element(route) ? prevData.withSelection(route.id) : prevData.subNavMenuData(route);
          if (childrenState?.isReady) data = data.withChildren(route, childrenState.data);
          data = data.withUpdatedElement(route, el => this.addDetailsToTreeElement(el, content));
          return of(readyState(data));
        }

      }
    }, fetchingState<NavTreeData>() /* mergeScan seed */, 1 /* concurrency = 1 so that we can always use the last state*/),

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
      const idx = navData.elements.findIndex(e => e.route.id === navData.selectedElementId);
      if (idx < 0) return undefined;

      const parent = navData.parent;
      if (parent && navData.pathToElements.length < 1) throw new Error('Unexpected: empty path with a parent');
      const prev = navData.elements[idx-1];
      const next = navData.elements[idx+1];

      return {
        parent: parent && parent.route.id !== this.navigationNeighborsRestrictedToDescendantOfElementId
          ? { navigateTo: (): void => parent.navigateTo() }
          : null,
        previous: prev ? { navigateTo: (): void => prev.navigateTo() } : null,
        next: next ? { navigateTo: (): void => next.navigateTo() } : null,
      };
    }),
  );

  constructor(private currentContent: CurrentContentService) {}

  /**
   * Return whether the given content info has the type expected in the nav tree
   */
  protected abstract isOfContentType(content: ContentInfo|null): content is ContentT;

  /**
   * Re-play the last change
   */
  retry(): void {
    this.reloadTrigger.next();
  }

  protected abstract addDetailsToTreeElement(treeElement: NavTreeElement, contentInfo: ContentT): NavTreeElement;
  protected abstract fetchRootTreeData(): Observable<NavTreeElement[]>;
  protected abstract fetchNavDataFromChild(id: string, child: ContentT): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }>;

  /**
   * Returns whether the given content may have children which can be fetched.
   * Returns `false` if it may not have children or if children cannot be fetched with the current info.
   */
   protected abstract canFetchChildren(content: ContentInfo): boolean;

  protected abstract fetchNavData(content: ContentInfo): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }>;

  private fetchChildren(content: ContentInfo): Observable<NavTreeElement[]> {
    return this.fetchNavData(content).pipe(map(navData => navData.elements));
  }

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
