import { combineLatest, merge, Observable, of, Subject } from 'rxjs';
import { delay, distinctUntilChanged, map, switchMap, shareReplay, scan, debounceTime } from 'rxjs/operators';
import { arraysEqual } from 'src/app/utils/array';
import { ensureDefined } from 'src/app/utils/assert';
import { isDefined } from 'src/app/utils/null-undefined-predicates';
import { FetchState, readyState } from 'src/app/utils/state';
import { ContentInfo, RoutedContentInfo } from 'src/app/models/content/content-info';
import { mapStateData, mapToFetchState } from 'src/app/utils/operators/state';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { EntityPathRoute } from 'src/app/models/routing/entity-route';

export interface NeighborInfo {
  navigateTo: () => void,
}

export interface NavigationNeighbors {
  parent: NeighborInfo|null,
  previous: NeighborInfo|null,
  next: NeighborInfo|null,
}

interface FetchInfo {
  path: EntityPathRoute['path'], /* path to the fetched elements */
  fetch: Observable<FetchState<NavTreeData>>,
}

export abstract class NavTreeService<ContentT extends RoutedContentInfo> {

  private reloadTrigger = new Subject<void>();
  private reload$ = merge(
    this.reloadTrigger,
    this.currentContent.navMenuReload$,
  );

  state$ = this.currentContent.content$.pipe(

    /**
     * PART 1 - PREPARING THE CONTENT
     * Only keep those of interest for the current nav tree
     */
    map(content => (this.isOfContentType(content) ? content : undefined)), // map those which are not of interest to `undefined`
    distinctUntilChanged(), // remove multiple `undefined`

    /**
     * PART 2 - PREPARING FETCHES
     * This part prepares the fetches to be executed in part 3. Unlike part 3, this part uses a `scan` which will not skip/cancel any input.
     * The benefit of separating part 2 from part 3 is that this part can choose to reuse fetches from the previous step in order to
     * prevent re-doing the same requests.
     * There are 2 fetches:
     * - level 1 (l1): this is the main list shown in the nav tree
     * - level 2 (l2): this is an optional list which shows the children of one the l1 element when it is selected.
     *   Note that providing l2Fetch in part 2 does not mean it will be shown (or even executed) as it is part 3 running the fetches.
    */
    scan<
      ContentT | undefined,
      { content: ContentT | undefined, l1Fetch$: FetchInfo, l2Fetch$?: FetchInfo },
      { content: ContentT | undefined, l1Fetch$?: FetchInfo, l2Fetch$?: FetchInfo }
    >((prev, content) => {

      // CASE 1: initial iteration
      if (!prev.l1Fetch$) {
        // CASE 1A: if no content matching the tab type, display the root
        // Test case: open the group tab while an activity was initially displayed -> should call the group root service only
        if (!content) return { content, l1Fetch$: this.fetchRootNav() };
        // CASE 1B: if content, just fetch it
        // Test case: open the app through a specific non-root content -> only required requests are done (1 or 2 calls to nav service)
        return { content, l1Fetch$: this.fetchNav(content), l2Fetch$: this.fetchChildrenNav(content) };
      }

      // CASE 3: The current-content does not match the type of this nav tree (so `content` has been mapped to `undefined`)
      //         -> keep the previous fetches
      // Test case: loading a chapter with children, then select a group -> the activity tab does not trigger any refetches
      if (!content) return { content, l1Fetch$: prev.l1Fetch$, l2Fetch$: prev.l2Fetch$ };

      // CASE 4: The l1 AND l2 needed are exactly what was fetched in the previous step -> reuse the fetches
      // Test cases:
      //  1) on loading content -> no navigation re-fetches are done while the content is "built-up" and children are shown after a while
      //  2) navigate from a l1 content to a children which does not have children -> no fetch at all
      //  3) navigate to l2 content without children to a sibling without children -> no fetch at all
      //  4) navigate from a l2 content to a sibling of the parent -> no fetch at all
      if (
        prev.l2Fetch$ && (
          // either the path to content children matches previous l2 path (so l1 will)
          arraysEqual([ ...content.route.path, content.route.id ], prev.l2Fetch$.path) ||
          // or the content is on l2 (it is a leaf), and so its path matches the previous l2 path (so l1 will)
          (!this.canFetchChildren(content) && arraysEqual(content.route.path, prev.l2Fetch$.path))
        )
      ) return { content, l1Fetch$: prev.l1Fetch$, l2Fetch$: prev.l2Fetch$ };

      // CASE 5: The l1 needed is the same as the previous l1. L2 is new (or empty) -> reuse l1
      // Test case: navigate from a l1 content to a sibling should only fetch the children
      if (arraysEqual(content.route.path, prev.l1Fetch$.path)) {
        return { content, l1Fetch$: prev.l1Fetch$, l2Fetch$: this.fetchChildrenNav(content) };
      }

      // CASE 6: The previous l2 becomes the new l1 (i.e., we navigate to a child content with children) -> reuse l2 as l1
      // Test case: navigate to a children -> only the new l2 (if any) is fetched, not the l1
      if (prev.l2Fetch$ && arraysEqual(content.route.path, prev.l2Fetch$.path)) {
        return { content, l1Fetch$: prev.l2Fetch$, l2Fetch$: this.fetchChildrenNav(content) };
      }

      // CASE 7: The previous l1 becomes the new l2 (i.e., we navigate to the parent) -> reuse l1 as l2
      // Test case: navigating to the parent -> only the new l1 is fetched, not the new l2 (children are shown immediately)
      if (arraysEqual([ ...content.route.path, content.route.id ], prev.l1Fetch$.path)) {
        return { content, l1Fetch$: this.fetchNav(content), l2Fetch$: prev.l1Fetch$ };
      }

      // CASE 8: no fetched info could be reused -> fetch all nav
      // Test case: navigating to a completely new content
      return { content, l1Fetch$: this.fetchNav(content), l2Fetch$: this.fetchChildrenNav(content) };

    }, { content: undefined } /* the scan seed */),

    /**
     * PART 3 - EXECUTE AND COMBINE FETCHES
     * Execute the given fetches (by subscribing to them) and combine their results to build nav tree data.
     * As it is a `switchMap`:
     * - it will handle the successive state of the fetches (first 'fetching', then 'ready' or 'error') as multiple emissions
     * - it will cancel the previous work-in-progress when a new input arrives
     * In practice, the fetches all have a `shareReplay` which protect them from cancellation as long as they are retained by the `scan`.
     * The shareReplay's use `{ refCount: true, bufferSize: 1 }` options so that the service call is cancelled when there are no more
     * subscribers, and so that new subscribers get the latest results on subscription.
     * (Note: discussion related to shareReplay refCount: https://github.com/ReactiveX/rxjs/issues/5029 -> a completed (http) source
     * will not be resubscribed (i.e., be re-executed) after its completion, even with refCount)
     *
     * Test case:
     * - normal navigation -> no request is cancelled to be re-executed
     * - navigate quickly between content (with connexion slowed down) -> some navigation requests are cancelled
     * - visit a chapter with children, visit a skill -> the children of the chapter are not shown anymore
    */
    switchMap(({ content, l1Fetch$, l2Fetch$ }) =>
      combineLatest([ l1Fetch$.fetch, l2Fetch$?.fetch ?? of(undefined) ]).pipe(
        debounceTime(0),
        map(([ l1FetchState, l2FetchState ]) => {
          if (!l1FetchState.data) return l1FetchState; // l1 is fetching without data or in error -> just show the fetching or error
          let data = l1FetchState.data;
          if (!content) return readyState(data.withNoSelection()); // no selected element -> only l1 shown
          if (l2FetchState?.data) data = data.withChildren(content.route, l2FetchState.data.elements);
          data = data.withUpdatedElement(content.route, el => this.addDetailsToTreeElement(el, content));
          data = data.withSelection(content.route.id);
          return readyState(data);
        })
      )
    ),

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
  navigationNeighbors$ = this.state$.pipe(
    mapStateData<NavTreeData, NavigationNeighbors|undefined>(navData => {
      if (!navData.selectedElementId) return undefined;
      const l1Idx = navData.elements.findIndex(
        e => e.route.id === navData.selectedElementId || e.children?.find(c => c.route.id === navData.selectedElementId)
      );
      if (l1Idx < 0) return undefined;
      const inL1 = navData.elements[l1Idx]?.route.id === navData.selectedElementId; // otherwise, in L2
      const l2Idx = inL1 ? -1 : ensureDefined(navData.elements[l1Idx]?.children).findIndex(e => e.route.id === navData.selectedElementId);
      const parent = inL1 ? navData.parent : navData.elements[l1Idx];
      const prev = inL1 ? navData.elements[l1Idx-1] : navData.elements[l1Idx]?.children?.[l2Idx-1];
      const next = inL1 ? navData.elements[l1Idx+1] : navData.elements[l1Idx]?.children?.[l2Idx+1];
      return {
        parent: (parent && parent.route.id !== this.navigationNeighborsRestrictedToDescendantOfElementId)
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
  protected abstract contentInfoFromNavTreeParent(e: NavTreeElement): ContentInfo;

  /**
   * Return a content with a dummy id located at root.
   * This is a hack to allow the "this.fetchRootNav()" fetch (which is run by default if nothing is selected) to be reused by the future
   * content updates.
   */
  protected abstract dummyRootContent(): ContentT;

  /**
   * Returns whether the given content may have children which can be fetched.
   * Returns `false` if it may not have children or if children cannot be fetched with the current info.
   */
  protected abstract canFetchChildren(content: ContentInfo): boolean;

  protected abstract fetchNavData(route: EntityPathRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }>;

  private fetchChildrenNav(content: RoutedContentInfo): FetchInfo|undefined {
    if (!this.canFetchChildren(content)) return undefined;
    const path = [ ...content.route.path, content.route.id ];
    return this.fetch(path, this.fetchNavData(content.route).pipe(
      map(data => new NavTreeData(data.elements, path, data.parent)),
    ));
  }

  private fetchRootNav(): FetchInfo {
    return this.fetch([], this.fetchRootTreeData().pipe(map(elements => new NavTreeData(elements, []))));
  }

  private fetchNav(content: ContentT): FetchInfo {
    const route = content.route;
    const parentId = route.path[route.path.length-1];
    if (isDefined(parentId)) {
      return this.fetch(route.path,
        this.fetchNavDataFromChild(parentId, content).pipe(map(data => new NavTreeData(data.elements, route.path, data.parent)))
      );
    } else return this.fetchRootNav();
  }

  private fetch(path: EntityPathRoute['path'], fetch: Observable<NavTreeData>): FetchInfo {
    return {
      path: path,
      fetch: fetch.pipe(
        mapToFetchState({ resetter: this.reload$ }),
        // The fetches need to use a `shareReplay` which protect them from cancellation as long as they are retained by the `scan`.
        // The shareReplay's use `{ refCount: true, bufferSize: 1 }` options so that the service call is cancelled when there are no more
        // subscribers, and so that new subscribers get the latest results on subscription.
        // (Note: discussion related to shareReplay refCount: https://github.com/ReactiveX/rxjs/issues/5029 -> a completed (http) source
        // will not be resubscribed (i.e., be re-executed) after its completion, even with refCount)
        shareReplay({ refCount: true, bufferSize: 1 }), /* see above for explanation */
      ),
    };
  }

}
