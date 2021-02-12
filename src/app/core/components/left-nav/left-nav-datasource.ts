import { concat, EMPTY, Observable, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { errorState, FetchError, Fetching, fetchingState, isReady, mapErrorToState, Ready, readyState } from 'src/app/shared/helpers/state';
import { switchScan } from 'src/app/shared/helpers/switch-scan';
import { ContentInfo } from 'src/app/shared/services/current-content.service';
import { NavTreeData, NavTreeElement } from '../../services/left-nav-loading/nav-tree-data';

export abstract class LeftNavDataSource<ContentT extends ContentInfo, MenuT extends NavTreeElement> {

  initialized = false;
  changes = new Subject<ContentT|undefined>();
  state: Ready<NavTreeData<MenuT>>|Fetching|FetchError = fetchingState();

  constructor() {

    this.changes.pipe(

      switchScan((prevState: Ready<NavTreeData<MenuT>>|Fetching|FetchError, contentInfo) => {

        if (isReady(prevState)) {
          // CASE: the current content is not an item and the menu has already items displayed
          if (!contentInfo) {
            if (prevState.data.selectedElementId !== undefined) return of(readyState(prevState.data.withNoSelection()));
            return EMPTY; // no change
          }

          const contentId = this.contentId(contentInfo);

          // CASE: the current content is already the selected one
          if (prevState.data.selectedElementId === contentId) {
            const newData = prevState.data.withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el));
            return concat(of(readyState(newData)), this.loadChildrenOfSelectedElement(newData));
          }

          // CASE: the content is among the displayed items at the root of the tree -> select the right one (might load children)
          if (prevState.data.hasLevel1Element(contentId)) {
            let newData = prevState.data.withSelection(contentId);
            newData = newData.withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el));
            return concat(of(readyState(newData)), this.loadChildrenOfSelectedElement(newData));
          }

          // CASE: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
          if (prevState.data.hasLevel2Element(contentId)) {
            let newData = prevState.data.subNavMenuData(contentId);
            newData = newData.withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el));
            return concat(of(readyState(newData)), this.loadChildrenOfSelectedElement(newData));
          }

        } else /* not ready state */ if (!contentInfo) {
          // CASE: the content is not an item and the menu has not already item displayed -> load item root
          return this.loadDefaultNav();
        }

        // OTHERWISE: the content is an item which is not currently displayed:

        // CASE: The current content type matches the current tab
        return this.loadNewNav(contentInfo);

      }, fetchingState()/* the switchScan accumulator seed */)
    ).subscribe({
      // As an update of `category` triggers a change and as switchMap ensures ongoing requests are cancelled when a new change happens,
      // the state updated here is on the same category as `prevState` above.
      next: newState => this.state = newState,
      error: e => this.state = errorState(e),
    });

  }

  /**
   * Prepare the data for display
   */
  focus(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.changes.next(undefined);
    }
  }

  /**
   * Load the given content in this tab
   */
  showContent(content: ContentT): void {
    this.initialized = true;
    this.changes.next(content);
  }

  /**
   * If there is a selected element, unselect this selection.
   */
  removeSelection(): void {
    if (this.initialized) this.changes.next(undefined);
  }

  abstract contentId(contentInfo: ContentT): string;
  abstract addDetailsToTreeElement(contentInfo: ContentT, treeElement: MenuT): MenuT;
  abstract loadRootTreeData(): Observable<MenuT[]>;
  abstract loadChildrenOfSelectedElement(data: NavTreeData<MenuT>): Observable<Ready<NavTreeData<MenuT>>|Fetching|FetchError>;
  // should be common
  abstract loadNewNavData(content: ContentT): Observable<NavTreeData<MenuT>>;
  // abstract loadNavDataFromChild(id: string, child: ContentT): Observable<NavTreeData<MenuT>>;

  private loadDefaultNav(): Observable<Ready<NavTreeData<MenuT>>|Fetching|FetchError> {
    return concat(
      of(fetchingState()),
      this.loadRootTreeData().pipe(
        map(elements => readyState(new NavTreeData(elements, [], undefined, undefined))),
        mapErrorToState()
      )
    );
  }

  private loadNewNav(content: ContentT): Observable<Ready<NavTreeData<MenuT>>|Fetching|FetchError> {
    return concat(
      of(fetchingState()), // as the menu change completely, display the loader
      this.loadNewNavData(content).pipe( // the new items (only first level loaded)
        // already update the tree with the first level, and if needed, load (async) children as well
        switchMap(data => concat(of(readyState(data)), this.loadChildrenOfSelectedElement(data))),
        mapErrorToState(),
      )
    );
  }

}
