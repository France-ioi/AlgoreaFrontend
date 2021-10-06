import { EMPTY, Observable, of, Subject } from 'rxjs';
import { delay, distinct, map, startWith, switchScan } from 'rxjs/operators';
import { isDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';
import { ContentInfo, RoutedContentInfo } from 'src/app/shared/models/content/content-info';
import { mapStateData, mapToFetchState } from 'src/app/shared/operators/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';

export abstract class NavTreeService<ContentT extends RoutedContentInfo> {

  private reloadTrigger = new Subject<void>();

  state$ = this.currentContent.content$.pipe(
    // map those which are not of interest to `undefined`
    map(content => (this.isOfContentType(content) ? content : undefined)),
    distinct(), // remove multiple `undefined`
    startWith(undefined),
    repeatLatestWhen(this.reloadTrigger),
    switchScan((prevState: FetchState<NavTreeData>, contentInfo) => {

      if (prevState.isReady) {
        const prevData = prevState.data;

        // CASE: the current content is not to be displayed in the menu and the menu has already an element displayed
        //       -> just deselect what is selected if there was a selection
        if (!contentInfo) {
          return prevData.selectedElementId === undefined ? EMPTY : of(readyState(prevData.withNoSelection()));
        }

        // CASE: the content is among the displayed items
        //       -> updates its data, and either select it if at root or shift the tree "to the left" otherwise
        const contentId = contentInfo.route.id;
        const contentInMenuLev1 = prevState.data.hasLevel1Element(contentId);
        const contentInMenuLev2 = prevState.data.hasLevel2Element(contentId);
        if (contentInMenuLev1 || contentInMenuLev2) {
          let data = contentInMenuLev1 ? prevData.withSelection(contentId) : prevData.subNavMenuData(contentId);
          data = data.withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el));
          return of(readyState(data));
        }

      } else /* prevState is not ready */ if (!contentInfo) {

        // CASE: the content is not an item and the menu has not already item displayed -> load item root
        return this.fetchDefaultNav();
      }

      // OTHERWISE: the content is an item which is not currently displayed:
      // CASE: The current content type matches the current tab
      return this.fetchNewNav(contentInfo).pipe(
        mapStateData(data => data.withUpdatedElement(contentInfo.route.id, el => this.addDetailsToTreeElement(contentInfo, el)))
      );
    }, fetchingState<NavTreeData>() /* the switchScan seed */),
    delay(0),
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

  protected abstract addDetailsToTreeElement(contentInfo: ContentT, treeElement: NavTreeElement): NavTreeElement;
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
