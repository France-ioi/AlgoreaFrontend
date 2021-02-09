import { concat, EMPTY, Observable, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ItemRoute } from 'src/app/shared/helpers/item-route';
import { isSkill, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { errorState, FetchError, Fetching, fetchingState, isReady, mapErrorToState, Ready, readyState } from 'src/app/shared/helpers/state';
import { switchScan } from 'src/app/shared/helpers/switch-scan';
import { ItemInfo } from 'src/app/shared/services/current-content.service';
import { ItemNavigationService, NavMenuItem, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { NavTreeData } from '../../services/left-nav-loading/nav-tree-data';
import { LeftNavDataSource } from './left-nav-datasource';

type State = Ready<NavTreeData<NavMenuItem>>|Fetching|FetchError;

export class LeftNavItemDataSource extends LeftNavDataSource {

  initialized = false;
  state: State = fetchingState();

  private changes = new Subject<ItemInfo|undefined>();

  constructor(
    private category: ItemTypeCategory,
    private itemNavService: ItemNavigationService
  ) {
    super();

    this.changes.pipe(

      switchScan((prevState: State, itemInfo) => {

        if (isReady(prevState)) {
          // CASE: the current content is not an item and the menu has already items displayed
          if (!itemInfo) {
            if (prevState.data.selectedElementId !== undefined) return of(readyState(prevState.data.withNoSelection()));
            return EMPTY; // no change
          }

          const itemData = itemInfo.data;
          if (!itemData.details) return of(fetchingState()); // unexpected as caller should not report a change without details
          const itemDetails = itemData.details;

          // CASE: the current content is already the selected one
          if (prevState.data.selectedElementId === itemData.route.id) {
            const newData = prevState.data.withUpdatedElement(itemData.route.id, el => ({
              ...el, title: itemDetails.title, attemptId: itemDetails.attemptId ?? null,
              bestScore: itemDetails.bestScore, currentScore: itemDetails.currentScore, validated: itemDetails.validated
            }));
            return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
          }

          // CASE: the content is among the displayed items at the root of the tree -> select the right one (might load children)
          if (prevState.data.hasLevel1Element(itemData.route.id)) {
            let newData = prevState.data.withSelection(itemData.route);
            newData = newData.withUpdatedElement(itemData.route.id, el => ({
              ...el, title: itemDetails.title, attemptId: itemDetails.attemptId ?? null,
              bestScore: itemDetails.bestScore, currentScore: itemDetails.currentScore, validated: itemDetails.validated
            }));
            return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
          }

          // CASE: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
          if (prevState.data.hasLevel2Element(itemData.route.id)) {
            let newData = prevState.data.subNavMenuData(itemData.route);
            newData = newData.withUpdatedElement(itemData.route.id, el => ({
              ...el, title: itemDetails.title, attemptId: itemDetails.attemptId ?? null,
              bestScore: itemDetails.bestScore, currentScore: itemDetails.currentScore, validated: itemDetails.validated
            }));
            return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
          }

        } else /* not ready state */ if (!itemInfo) {
          // CASE: the content is not an item and the menu has not already item displayed -> load item root
          return this.loadDefaultNav();
        }

        // OTHERWISE: the content is an item which is not currently displayed:

        // CASE: The current content type matches the current tab
        return this.loadNewNav(itemInfo.data.route);

      }, fetchingState()/* the switchScan accumulator seed */)
    ).subscribe({
      // As an update of `category` triggers a change and as switchMap ensures ongoing requests are cancelled when a new change happens,
      // the state updated here is on the same category as `prevState` above.
      next: newState => this.state = newState,
      error: e => this.state = errorState(e),
    });
  }

  showContent(content: ItemInfo): void {
    this.initialized = true;
    this.changes.next(content);
  }

  focus(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.changes.next(undefined);
    }
  }

  removeSelection(): void {
    if (this.initialized) this.changes.next(undefined);
  }

  /**
   * Load children of the given item if it has children and has an attempt
   */
  private loadChildrenIfNeeded(data: NavTreeData<NavMenuItem>, item = data.selectedElement()): Observable<State> {
    if (!item) return of(errorState(new Error('Cannot find selected element (or no selection) (unexpected)')));
    if (!item.hasChildren || item.attemptId === null) return EMPTY; // if no children, no need to fetch children

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(item.id, item.attemptId, isSkill(this.category)).pipe(
      map(nav => readyState(data.withUpdatedElement(item.id, el => ({ ...el, ...nav.parent, children: nav.items })))),
      mapErrorToState()
    );
  }

  private loadDefaultNav(): Observable<State> {
    return concat(
      of(fetchingState()),
      this.itemNavService.getRoot(this.category).pipe(
        map(items => readyState(new NavTreeData(items.items, [], undefined, undefined))),
        mapErrorToState()
      )
    );

    /*
    load a default configured element:
    const route = appDefaultItemRoute(this.category);
    return concat(
      of(fetchingState()),
      this.itemNavService.getRoot(this.category).pipe(
        map(items => new ItemNavMenuData(items.items, [], undefined, undefined, [ route.id ])),
        switchMap(menuData => concat(of(readyState(menuData)), this.startResultAndLoadChildren(menuData, route))),
        mapErrorToState()
      )
    );
    */
  }


  private loadNewNav(item: ItemRoute): Observable<State> {
    let dataFetcher: Observable<NavMenuRootItem>;
    if (item.path.length >= 1) {
      const parentId = item.path[item.path.length-1];
      dataFetcher = this.itemNavService.getNavDataFromChildRoute(parentId, item, isSkill(this.category));
    } else {
      dataFetcher = this.itemNavService.getRoot(this.category);
    }
    return concat(
      of(fetchingState()), // as the menu change completely, display the loader
      dataFetcher.pipe(
        map(items => new NavTreeData(items.items, item.path, item.id, items.parent)), // the new items (only first level loaded)
        // already update the tree loaded with the first level, and if needed, load (async) children as well
        switchMap(data => concat(of(readyState(data)), this.loadChildrenIfNeeded(data))),
        mapErrorToState(),
      )
    );
  }

}
