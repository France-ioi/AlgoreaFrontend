import { concat, EMPTY, Observable, ObservableInput, of, OperatorFunction, Subject } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { errorState, FetchError, Fetching, fetchingState, isReady, Ready, readyState } from 'src/app/shared/helpers/state';
import { RoutedContentInfo } from 'src/app/shared/models/content/content-info';
import { NavTreeData, NavTreeElement } from '../../services/left-nav-loading/nav-tree-data';

const msBetweenChildrenRefetch = 5000;
type Id = string;

/* Type definition for the updates */
enum SelectionOpts { UnChanged, Deselected, Selected }
interface DataSourceUpdate<T extends NavTreeElement> {
  type: 'update',
  elementId?: Id, // element to be selected or updated
  selection: SelectionOpts,
  elementUpdate?: (el:T) => T, // if set, function to update the element identified by elementId
}
interface DataSourceReplacement<T extends NavTreeElement> {
  type: 'replace'
  data: NavTreeData<T>
}
interface DataSourceLoading { type: 'loading' }
interface DataSourceError { type: 'error', error: any }
type DataSourceChange<T extends NavTreeElement> = DataSourceUpdate<T>|DataSourceReplacement<T>|DataSourceLoading|DataSourceError;
function dsDeselect<T extends NavTreeElement>(): DataSourceUpdate<T> {
  return { type: 'update', selection: SelectionOpts.Deselected };
}
function dsUpdateElement<T extends NavTreeElement>(id: Id, select: boolean, update: (el:T) => T): DataSourceUpdate<T> {
  return { type: 'update', selection: select ? SelectionOpts.Selected : SelectionOpts.UnChanged, elementId: id, elementUpdate: update };
}
function dsReplaceWith<T extends NavTreeElement>(data: NavTreeData<T>): DataSourceReplacement<T> {
  return { type: 'replace', data: data };
}
function dsLoading(): DataSourceLoading {
  return { type: 'loading' };
}
function dsError(err: any): DataSourceError {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { type: 'error', error: err };
}
function isDSLoading<T extends NavTreeElement>(change: DataSourceChange<T>): change is DataSourceLoading {
  return change.type === 'loading';
}
function isDSError<T extends NavTreeElement>(change: DataSourceChange<T>): change is DataSourceError {
  return change.type === 'error';
}
function isDSUpdate<T extends NavTreeElement>(change: DataSourceChange<T>): change is DataSourceUpdate<T> {
  return change.type === 'update';
}
function isDSReplace<T extends NavTreeElement>(change: DataSourceChange<T>): change is DataSourceReplacement<T> {
  return change.type === 'replace';
}


export abstract class LeftNavDataSource<ContentT extends RoutedContentInfo, MenuT extends NavTreeElement> {

  private initialized = false;
  private contentChanges = new Subject<[content: ContentT|undefined, state: Ready<NavTreeData<MenuT>>|Fetching|FetchError]>();
  private retryTrigger = new Subject<void>();
  state: Ready<NavTreeData<MenuT>>|Fetching|FetchError = fetchingState();

  constructor() {

    this.contentChanges.pipe(

      repeatLatestWhen(this.retryTrigger),

      mergeMap(([ contentInfo, prevState ]):ObservableInput<DataSourceChange<MenuT>> => {

        if (isReady(prevState)) {
          // CASE: the current content is not an item and the menu has already items displayed
          if (!contentInfo) {
            if (prevState.data.selectedElementId !== undefined) return of(dsDeselect());
            return EMPTY; // no change
          }

          const contentId = contentInfo.route.id;

          // CASE: the current content is already the selected one
          if (prevState.data.selectedElementId === contentId) {
            return concat(
              of(dsUpdateElement<MenuT>(contentId, false, el => this.addDetailsToTreeElement(contentInfo, el))),
              this.fetchChildrenOfElementWithId(
                prevState.data.withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el)), contentId
              )
            );
          }

          // CASE: the content is among the displayed items at the root of the tree -> select the right one (might load children)
          if (prevState.data.hasLevel1Element(contentId)) {
            return concat(
              of(dsUpdateElement<MenuT>(contentId, true, el => this.addDetailsToTreeElement(contentInfo, el))),
              this.fetchChildrenOfElementWithId(
                prevState.data.withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el)), contentId
              )
            );
          }

          // CASE: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
          if (prevState.data.hasLevel2Element(contentId)) {
            return concat(
              of(dsUpdateElement<MenuT>(contentId, true, el => this.addDetailsToTreeElement(contentInfo, el))),
              this.fetchChildrenOfElementWithId(
                prevState.data.subNavMenuData(contentId)
                  .withUpdatedElement(contentId, el => this.addDetailsToTreeElement(contentInfo, el)),
                contentId
              )
            );
          }

        } else /* not ready state */ if (!contentInfo) {
          // CASE: the content is not an item and the menu has not already item displayed -> load item root
          return concat(of(dsLoading()), this.fetchDefaultNav());
        }

        // OTHERWISE: the content is an item which is not currently displayed:

        // CASE: The current content type matches the current tab
        return concat(of(dsLoading()), this.fetchNewNav(contentInfo));

      })
    ).subscribe({
      // As an update of `category` triggers a change and as switchMap ensures ongoing requests are cancelled when a new change happens,
      // the state updated here is on the same category as `prevState` above.
      next: change => {
        if (isDSLoading(change)) this.state = fetchingState();
        else if (isDSError(change)) this.state = errorState(change.error);
        else if (isDSUpdate(change) && isReady(this.state)) {
          let data = this.state.data;
          if (change.selection === SelectionOpts.Deselected) data = data.withNoSelection();
          if (change.elementId) {
            const id = change.elementId;
            if (!data.hasLevel1Element(id) && data.hasLevel2Element(id)) data = data.subNavMenuData(id);
            if (data.hasLevel1Element(id) && change.selection === SelectionOpts.Selected) data = data.withSelection(id);
            if (change.elementUpdate) data = data.withUpdatedElement(id, change.elementUpdate);
          }
          this.state = readyState(data);
        } else if (isDSReplace(change)) {
          this.state = readyState(change.data);
        }
      },
      error: e => this.state = errorState(e),
    });

  }

  /**
   * Prepare the data for display
   */
  focus(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.contentChanges.next([ undefined, this.state ]);
    }
  }

  /**
   * Re-play the last change
   */
  retry(): void {
    this.retryTrigger.next();
  }

  /**
   * Load the given content in this tab
   */
  showContent(content: ContentT): void {
    this.initialized = true;
    this.contentChanges.next([ content, this.state ]);
  }

  /**
   * If there is a selected element, unselect this selection.
   */
  removeSelection(): void {
    if (this.initialized) this.contentChanges.next([ undefined, this.state ]);
  }

  protected abstract addDetailsToTreeElement(contentInfo: ContentT, treeElement: MenuT): MenuT;
  protected abstract fetchRootTreeData(): Observable<MenuT[]>;
  protected abstract fetchNavDataFromChild(id: string, child: ContentT): Observable<{ parent: MenuT, elements: MenuT[] }>;
  protected abstract fetchNavData(item: MenuT): Observable<{ parent: MenuT, elements: MenuT[] }>;


  private fetchChildrenOfElementWithId(data: NavTreeData<MenuT>, id: Id): Observable<DataSourceChange<MenuT>> {
    const element = data.elementWithId(id);
    if (element === undefined) return EMPTY;
    return this.fetchChildrenOfElement(element);
  }

  private fetchChildrenOfElement(element: MenuT): Observable<DataSourceChange<MenuT>> {
    if (!element.hasChildren) return EMPTY; // if no children, no need to fetch children
    if (element.latestChildrenFetch && Date.now() - element.latestChildrenFetch.valueOf() < msBetweenChildrenRefetch && element.children) {
      return EMPTY;
    }
    element.latestChildrenFetch = new Date();

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.fetchNavData(element).pipe(
      map(newData => dsUpdateElement<MenuT>(element.id, false, el => ({ ...el, ...newData.parent, children: newData.elements }))),
      this.mapError()
    );
  }

  private fetchNewNavData(content: ContentT): Observable<NavTreeData<MenuT>> {
    const route = content.route;
    if (route.path.length >= 1) {
      const parentId = route.path[route.path.length-1];
      return this.fetchNavDataFromChild(parentId, content).pipe(
        map(data => new NavTreeData(data.elements, route.path, route.id, data.parent))
      );
    } else {
      return this.fetchRootTreeData().pipe(
        map(items => new NavTreeData(items, route.path, route.id))
      );
    }
  }

  private fetchDefaultNav(): Observable<DataSourceChange<MenuT>> {
    return this.fetchRootTreeData().pipe(
      map(elements => dsReplaceWith(new NavTreeData(elements, [], undefined, undefined))),
      this.mapError(),
    );
  }

  private fetchNewNav(content: ContentT): Observable<DataSourceChange<MenuT>> {
    return this.fetchNewNavData(content).pipe( // the new items (only first level loaded)
      // already update the tree with the first level, and if needed, load (async) children as well
      switchMap(data => {
        const selectedEl = data.selectedElement();
        if (!selectedEl) throw new Error('Unexpected: no selected element in new nav');
        return concat(of(dsReplaceWith<MenuT>(data)), this.fetchChildrenOfElement(selectedEl));
      }),
      this.mapError(),
    );
  }

  private mapError(): OperatorFunction<DataSourceChange<MenuT>, DataSourceChange<MenuT>> {
    return catchError(e => of(dsError(e)));
  }

}
