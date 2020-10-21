import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ItemNavigationService, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { CurrentContentService, isItemInfo } from 'src/app/shared/services/current-content.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, Observable, merge, throwError, EMPTY, Subscription } from 'rxjs';
import { NavItem } from 'src/app/shared/services/nav-types';

interface NavMenuData extends NavMenuRootItem {
  pathToItems: string[]; // path from root to the elements in `items` (so including the parent if any)
  selectedItem?: NavItem
}

type NavMenuDataState = 'init'|'loading'|'error'|NavMenuData;

function navMenuDataWith(items: NavMenuRootItem, path: string[], selectedItem?: NavItem): NavMenuData {
  return Object.assign(items, { pathToItems: path, selectedItem: selectedItem });
}
function navMenuDataWithSelection(items: NavMenuData, selectedItem?: NavItem): NavMenuData {
  return Object.assign(items, { selectedItem: selectedItem });
}
interface ItemResultInfo { attemptId: string, bestScore: number, currentScore: number, validated: boolean }
function navMenuDataWithUpdatedNode(menuData: NavMenuData, item: NavItem, result: ItemResultInfo): NavMenuData {
  const currentItemIdx = menuData.items.findIndex(i => i.id === item.itemId);
  if (currentItemIdx === -1) return menuData; // unexpected
  const newItems = [...menuData.items];
  newItems[currentItemIdx] = {
    ...menuData.items[currentItemIdx],
    attemptId: result.attemptId,
    score: { best: result.bestScore, current: result.currentScore, validated: result.validated }
  };
  return { ...menuData, items: newItems};
}

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: ['./item-nav.component.scss']
})
export class ItemNavComponent implements OnInit, OnDestroy {
  @Input() type: 'activity'|'skill';
  data: NavMenuDataState = 'init';
  rootItemPath: string[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private itemNavService: ItemNavigationService,
    private currentContent: CurrentContentService,
  ) { }

  loadRootNav(): Observable<NavMenuDataState> {
    return merge(
      of('loading'), // first change items to loading
      this.itemNavService.getRoot(this.type).pipe(
        map(items => navMenuDataWith(items, []))
      )
    );
  }

  loadNewNav(item: NavItem): Observable<NavMenuDataState> {
    let dataFetcher: Observable<NavMenuRootItem>;
    if (item.itemPath.length >= 1) {
      const parentId = item.itemPath[item.itemPath.length-1];
      if (item.parentAttemptId) dataFetcher = this.itemNavService.getNavData(parentId, item.parentAttemptId);
      else if (item.attemptId) dataFetcher = this.itemNavService.getNavDataFromChildAttempt(parentId, item.attemptId);
      else return throwError(new Error('Requires either the parent or child attempt to load nav'));
    } else {
      dataFetcher = this.itemNavService.getRoot(this.type);
    }
    return merge(
      of('loading'), // as the menu change completely, display the loader
      dataFetcher.pipe(
        map(items => navMenuDataWith(items, item.itemPath, item)), // the new items (only first level loaded)
        // already update the tree loaded with the first level, and if needed, load (async) children as well
        switchMap(data => merge( of(data), this.loadChildrenIfNeeded(data) )),
      )
    );
  }

  loadChildrenIfNeeded(data: NavMenuData): Observable<NavMenuDataState> {
    const selectedItem = data.selectedItem;
    if (!selectedItem) return EMPTY; // if nothing selected, no need to load more (this function should not be called in this case)

    // the selected item should be one of the items at the first level
    const itemData = data.items.find(item => item.id === selectedItem.itemId);
    if (!itemData) return throwError(new Error('Cannot find the item (unexpected)'));
    if (!itemData.hasChildren) return EMPTY; // if no children, no need to fetch children
    if (!selectedItem.attemptId) return throwError(new Error('Cannot fetch children without attempt (unexpected'));

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(itemData.id, selectedItem.attemptId).pipe(
      map(nav => ({
        parent: data.parent,
        pathToItems: data.pathToItems,
        selectedItem: data.selectedItem,
        items: data.items.map(i => {
          if (i.id === itemData.id) {
            // replace the previous item by new item (the same with possibly an attempt) with the fetched children
            return {...i, ...nav.parent, children: nav.items};
          } else {
            return i;
          }
        })
      }))
    );
  }

  /**
   * `item` is one of the children of one root item. Replace the current tree parent by this root item and the root items by
   * its children (including item).
   * Then load 'item' 's children  if it has some.
   */
  treeShiftedToChild(item: NavItem): Observable<NavMenuDataState> {
    const menuItems = this.data as NavMenuData;
    const newParent = menuItems.items.find(i => i.children && i.children.some(c => c.id === item.itemId));
    if (!newParent || !newParent.children /* unexpected */) return of(this.data);
    const newData = {
      parent: newParent,
      items: newParent.children,
      pathToItems: menuItems.pathToItems.concat([newParent.id]),
      selectedItem: item,
    };
    return merge(of(newData), this.loadChildrenIfNeeded(newData));
  }

  ngOnInit() {

    this.subscriptions.push(

      // This first subscription only follow change in the current item id and use switch map to cancel previous requests
      this.currentContent.currentContent$.pipe(

        // we are only interested in items
        map(content => (content !== null && isItemInfo(content) ? content.data : null)),
        distinctUntilChanged((v1, v2) => v1 === null && v2 === null || ( v1 !== null && v2 !== null && v1.nav.itemId === v2.nav.itemId)),

        // switchMap may cancel ongoing network calls if item is changed while the request is not over. That's what we want!
        switchMap((item):Observable<NavMenuDataState> => {

          // CASE 0: the current content is not an item and the menu has already items displayed -> do nothing
          if (item === null && this.isLoaded()) return EMPTY;

          // CASE 1: the content is not an item and the menu has not already item displayed -> load item root
          if (item === null) {
            return this.loadRootNav();
          }

          // CASE 2: the content is among the displayed items at the root of the tree -> select the right one (might load children)
          if (this.hasItemAmongTreeRoots(item.nav)) {
            const data = navMenuDataWithSelection(this.data as NavMenuData, item.nav);
            return merge(of(data), this.loadChildrenIfNeeded(data));
          }

          // CASE 3: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
          if (this.hasItemAmongKnownTreeChildren(item.nav)) {
            return this.treeShiftedToChild(item.nav);
          }

          // CASE 4: the content is an item not in case 2 or 3 -> load the tree and select the right one
          return this.loadNewNav(item.nav);
        })
      ).subscribe({
        next: change => this.data = change,
        error: _e => this.data = 'error'
      }),

      // If the new current item is already the selected one, just update its data (do not cancel ongoing requests)
      this.currentContent.currentContent$.pipe(
        map(content => (content !== null && isItemInfo(content) ? content.data : null)),
      ).subscribe(item => {
        if (item !== null && this.isLoaded() && (this.data as NavMenuData).selectedItem?.parentAttemptId === item.nav.itemId) {
          // only update in case 'result' (the score) is given
          if (item.result) this.data = navMenuDataWithUpdatedNode(this.data as NavMenuData, item.nav, item.result);
        }
      })
    );


  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /*** Helper functions ***/

  /**
   * Return whether this has loaded items (so is not in 'init'|'loading'|'error' state)
   */
  isLoaded() {
    return typeof this.data !== 'string';
  }

  isSelectedItem(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as NavMenuData;
    return menuItems.selectedItem?.itemId === item.itemId;
  }

  hasItemAmongTreeRoots(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as NavMenuData;
    return menuItems.items.some(i => i.id === item.itemId);
  }

  hasItemAmongKnownTreeChildren(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as NavMenuData;
    return menuItems.items.some(i => i.children && i.children.some(c => c.id === item.itemId));
  }

}
