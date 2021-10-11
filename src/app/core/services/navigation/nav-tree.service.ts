import { combineLatest, Observable, of, OperatorFunction, Subject } from 'rxjs';
import { delay, distinctUntilChanged, map, mergeScan, shareReplay, startWith } from 'rxjs/operators';
import { isDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { ContentInfo, RoutedContentInfo } from 'src/app/shared/models/content/content-info';
import { mapStateData, mapToFetchState } from 'src/app/shared/operators/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';

export abstract class NavTreeService<ContentT extends RoutedContentInfo, ChildrenInfoT> {

  private reloadTrigger = new Subject<void>();

  private content$ = this.currentContent.content$.pipe( // only keep those of interest for the current nav tree
    // map those which are not of interest to `undefined`
    map(content => (this.isOfContentType(content) ? content : undefined)),
    distinctUntilChanged(), // remove multiple `undefined`
    startWith(undefined),
    repeatLatestWhen(this.reloadTrigger),
  );
  private children$ = this.content$.pipe(this.childrenNavigation());
  state$ = combineLatest([ this.content$, this.children$ ]).pipe(
    mergeScan((prevState: FetchState<NavTreeData>, [ content, children ]) => {

      // CASE 1: the content is not of type of this menu
      if (!content) {
        // CASE 1A: the menu has already an element displayed -> just deselect what is selected if there was a selection
        if (prevState.isReady) return of(readyState(prevState.data.withNoSelection()));
        // CASE 1B: the menu has nothing displayed yet -> load item root
        else return this.fetchDefaultNav();

      } else {
      // CASE 2: content is of type of this menu
        const route = content.route;

        if (prevState.isReady && prevState.data.hasElement(route)) {
          // CASE 2A : the content is among the displayed elements -> either select it if at root or shift the tree "to the left" otherwise
          const prevData = prevState.data;
          let data = prevData.hasLevel1Element(route) ? prevData.withSelection(route.id) : prevData.subNavMenuData(route);
          data = data.withUpdatedElement(route, el => this.addDetailsToTreeElement(el, content, children));
          return of(readyState(data));

          // CASE 2B: the content is not among the displayed elements -> fetch all nav
        } else {
          return this.fetchNewNav(content).pipe(
            mapStateData(data => {
              data = data.withUpdatedElement(route, el => this.addDetailsToTreeElement(el, content, children));
              return data;
            })
          );
        }
      }
    }, fetchingState<NavTreeData>() /* the switchScan seed */, 1 /* concurrency = 1 so that we can always use the last state*/),
    delay(0),
    shareReplay(1),
  );

  constructor(private currentContent: CurrentContentService) {}

  /**
   * Return whether the given content info has the type expected in the nav tree
   */
  protected abstract isOfContentType(content: ContentInfo|null): content is ContentT;

  /**
   * Operator which emit the children (or undefined if none or not known yet) of a content stream
   */
  protected abstract childrenNavigation(): OperatorFunction<ContentT|undefined,ChildrenInfoT|undefined>;

  /**
   * Re-play the last change
   */
  retry(): void {
    this.reloadTrigger.next();
  }

  protected abstract addDetailsToTreeElement(treeElement: NavTreeElement, contentInfo: ContentT, children?: ChildrenInfoT): NavTreeElement;
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
