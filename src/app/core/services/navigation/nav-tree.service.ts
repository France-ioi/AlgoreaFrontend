import { combineLatest, EMPTY, merge, Observable, of, Subject } from 'rxjs';
import { delay, distinctUntilChanged, map, switchMap, shareReplay, startWith, scan } from 'rxjs/operators';
import { isDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { FetchState, readyState } from 'src/app/shared/helpers/state';
import { areParentChild, areSameElements, areSiblings, ContentInfo, RoutedContentInfo } from 'src/app/shared/models/content/content-info';
import { mapStateData, mapToFetchState } from 'src/app/shared/operators/state';
import { ContentRoute } from 'src/app/shared/routing/content-route';
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

interface ReusableFetch {
  initial: Observable<NavTreeData>,
  shared: Observable<FetchState<NavTreeData>>,
}

function reusable(fetch: Observable<NavTreeData>): ReusableFetch {
  return {
    initial: fetch,
    shared: fetch.pipe(
      mapToFetchState(),
      shareReplay({ refCount: true, bufferSize: 1 }), /* see above for explanation */
    ),
  };
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
    // emits the content+reload:false immediately, emit content+reload:true when/if `reloadTrigger` emits
    switchMap(content => this.reload$.pipe(map(() => ({ content, reload: true })), startWith({ content, reload: false }))),

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
    scan((
      prev: {
        content: ContentT | undefined, // The "input" content. Not to be used in the scan accumulator, only for part 3
        fetchedContent: ContentT | undefined, // What content corresponds to the fetches. Only for accumulator use, not to be used in part 3
        l1Fetch$: ReusableFetch,
        l2Fetch$?: ReusableFetch, /* undefined if l2 cannot (currently) be fetched */
      },
      { content, reload } // the scan input
    ) => {

      // CASE 1: The current-content does not match the type of this nav tree (so `content` has been mapped to `undefined`)
      //         In such a case, we never display the l2, so no need to fetch it if it is not already available.
      if (!content) {

        // CASE 1A: At first iteration, if no content, display the root.
        // Test case: opening the group tab while an activity was initially displayed -> should call the group root service only
        if (!prev.fetchedContent) return { content, fetchedContent: this.dummyRootContent(), l1Fetch$: this.fetchRootNav() };

        // CASE 1B: "reload" (l2 is not refetched as not displayed)
        // Test case: trigger a reload -> see l1 refetch
        if (reload) return { content, fetchedContent: prev.fetchedContent, l1Fetch$: this.fetchNav(prev.fetchedContent) };

        // CASE 1C: otherwise -> keep the previous fetches (l2 is kept but will not be shown)
        // Test case: loading an chapter with children, then select a group -> the l1 of the activity menu stays as it was
        //            reselect the activity -> the activity menu does not trigger any refetches even for showing the children
        return { ...prev, content };
      }

      // CASE 2: the content type matches the type of this nav tree

      // CASE 2A: if first iteration or reload: fetch everything (equivalent to case 2F)
      // Test case: trigger a reload
      // Test case: opening the app through a specific non-root content -> only required requests are done (1 or 2 calls to nav service)
      if (reload || !prev.fetchedContent) {
        return { content, fetchedContent: content, l1Fetch$: this.fetchNav(content), l2Fetch$: this.fetchChildrenNav(content) };
      }
      // CASE 2B: the fetched content and new one are the same -> keep the content
      // Test case: on loading a page -> no navigation re-fetches are done (while the content is "built-up", so resubmitted several times)
      //                              -> children are shown after a while
      if (areSameElements(prev.fetchedContent, content)) {
        return { content, fetchedContent: content, l1Fetch$: prev.l1Fetch$, l2Fetch$: prev.l2Fetch$ ?? this.fetchChildrenNav(content) };
      }
      // CASE 2C: the fetched content and new one are siblings -> keep the content, change l2
      // Test case: navigating to a sibling -> the l1 is not re-fetched
      if (areSiblings(prev.fetchedContent, content)) {
        return { content, fetchedContent: content, l1Fetch$: prev.l1Fetch$, l2Fetch$: this.fetchChildrenNav(content) };
      }
      // CASE 2D: the fetched content is the parent of the new one -> use previous l2 as new l1
      // Test case: navigating to a children -> only the new l2 (if any) is fetched, not the l1
      if (areParentChild({ parent: prev.fetchedContent, child: content }) && prev.l2Fetch$) {
        return { content, fetchedContent: content, l1Fetch$: prev.l2Fetch$, l2Fetch$: this.fetchChildrenNav(content) };
      }
      // CASE 2E: the fetched content is the child of the new one -> use previous l1 as l2
      // Test case: navigating to the parent -> only the new l1 is fetched, not the new l2 (children are shown immediately)
      if (areParentChild({ parent: content, child: prev.fetchedContent })) {
        return { content, fetchedContent: content, l1Fetch$: this.fetchNav(content), l2Fetch$: prev.l1Fetch$ };
      }
      // CASE 2F: no fetched info could be reused -> fetch all nav
      // Test case: navigating to a completely new content
      return { content, fetchedContent: content, l1Fetch$: this.fetchNav(content), l2Fetch$: this.fetchChildrenNav(content) };

    }, { content: undefined, fetchedContent: undefined, l1Fetch$: { initial: EMPTY, shared: EMPTY } } /* the scan seed */),

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
      combineLatest([ l1Fetch$.shared, l2Fetch$?.shared ?? of(undefined) ]).pipe(
        map(([ l1FetchState, l2FetchState ]) => {
          if (!l1FetchState.isReady) return l1FetchState; // l1 is fetching or in error -> just show the fetching or error
          if (!content) return readyState(l1FetchState.data.withNoSelection()); // no selected element -> only l1 shown

          let data = l1FetchState.data;
          if (l2FetchState?.isReady) data = data.withChildren(content.route, l2FetchState.data.elements);
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

  protected abstract fetchNavData(route: ContentRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }>;

  private fetchChildrenNav(content: RoutedContentInfo): ReusableFetch|undefined {
    if (!this.canFetchChildren(content)) return undefined;
    return reusable(
      this.fetchNavData(content.route).pipe(
        map(data => new NavTreeData(data.elements, [ ...content.route.path, content.route.id ], data.parent)),
      )
    );
  }

  private fetchRootNav(): ReusableFetch {
    return reusable(this.fetchRootTreeData().pipe(map(elements => new NavTreeData(elements, []))));
  }

  private fetchNav(content: ContentT): ReusableFetch {
    const route = content.route;
    const parentId = route.path[route.path.length-1];
    if (isDefined(parentId)) {
      return reusable(
        this.fetchNavDataFromChild(parentId, content).pipe(map(data => new NavTreeData(data.elements, route.path, data.parent)))
      );
    } else return this.fetchRootNav();
  }

}
