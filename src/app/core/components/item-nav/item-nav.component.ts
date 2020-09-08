import { Component, OnInit, Input } from '@angular/core';
import { ItemNavigationService, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { map, switchMap } from 'rxjs/operators';
import { of, Observable, merge } from 'rxjs';
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

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: ['./item-nav.component.scss']
})
export class ItemNavComponent implements OnInit {
  @Input() type: 'activity'|'skill';
  data: NavMenuDataState = 'init';
  rootItemPath: string[] = [];

  constructor(
    private itemNavService: ItemNavigationService,
    private currentContent: CurrentContentService,
  ) { }

  loadRootNav(): Observable<NavMenuDataState> {
    return merge(
      of('loading'), // first change items to loading
      this.itemNavService.getRoot(this.type).pipe(
        map((items) => {
          return navMenuDataWith(items, []);
        })
      )
    );
  }

  loadNewNav(item: NavItem): Observable<NavMenuDataState> {
    let dataFetcher: Observable<NavMenuRootItem>;
    if (item.itemPath.length >= 1) {
      const parentId = item.itemPath[item.itemPath.length-1];
      dataFetcher = this.itemNavService.getNavData(parentId, item.parentAttemptId, item.attemptId);
    } else {
      dataFetcher = this.itemNavService.getRoot(this.type);
    }
    return merge(
      of('loading'), // as the menu change completely, display the loader
      dataFetcher.pipe(
        map((items) => {
          return navMenuDataWith(items, item.itemPath, item); // the new items (only first level loaded)
        }),
        switchMap((data) => {
          // already update the tree loaded with the first level, and if needed, load (async) children as well
          return merge( of(data), this.loadChildrenIfNeeded(data) );
        }),
      )
    );
  }

  loadChildrenIfNeeded(data: NavMenuData): Observable<NavMenuDataState> {
    if (!data.selectedItem) return of(); // if nothing selected, no need to load more (this function should not be called in this case)

    // the selected item should be one of the items at the first level
    const itemData = data.items.find((item) => item.id === data.selectedItem.itemId);
    if (!itemData.hasChildren) return of(); // if no children, no need to fetch children

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(itemData.id, data.selectedItem.attemptId).pipe(
      map( (nav) => {
        return {
          parent: data.parent,
          pathToItems: data.pathToItems,
          selectedItem: data.selectedItem,
          items: data.items.map((i) => {
            if (i.id === itemData.id) {
              return Object.assign({}, i, {children: nav.items}); // a copy of the item with different children
            } else {
              return i;
            }
          })
        };
      })
    );
  }

  /**
   * `item` is one of the children of one root item. Replace the current tree parent by this root item and the root items by
   * its children (including item).
   * Then load 'item' 's children  if it has some.
   */
  treeShiftedToChild(item: NavItem): Observable<NavMenuDataState> {
    const menuItems = this.data as NavMenuData;
    const newParent = menuItems.items.find((i) => i.children && i.children.some((c) => c.id === item.itemId));
    if (!newParent || !newParent.children) return of(this.data);
    const newData = {
      parent: newParent,
      items: newParent.children,
      pathToItems: menuItems.pathToItems.concat([newParent.id]),
      selectedItem: item,
    };
    return merge(of(newData), this.loadChildrenIfNeeded(newData));
  }

  ngOnInit() {

    this.currentContent.item().pipe(
      // switchMap may cancel ongoing network calls if item is changed while the request is not over. That's what we want!
      switchMap((item):Observable<NavMenuDataState> => {

        // CASE 0: the current content is not an item and the menu has already items displayed -> do nothing
        if (item === null && this.isLoaded()) return of();

        // CASE 1: the content is not an item and the menu has not already item displayed -> load item root
        if (item === null) {
          return this.loadRootNav();
        }

        // CASE 2: the content is among the displayed items at the root of the tree -> select the right one (might load children)
        if (this.hasItemAmongTreeRoots(item)) {
          const data = navMenuDataWithSelection(this.data as NavMenuData, item);
          return merge(of(data), this.loadChildrenIfNeeded(data));
        }

        // CASE 3: the content is a child of one of the items at the root of the tree -> shift the tree and select it (might load children)
        if (this.hasItemAmongKnownTreeChildren(item)) {
          return this.treeShiftedToChild(item);
        }

        // CASE 4: the content is an item not in case 2 or 3 -> load the tree and select the right one
        return this.loadNewNav(item);
      })
    ).subscribe({
      next: (change) =>  this.data = change,
      error: (_e) => this.data = 'error'
    });
  }

  /*** Helper functions ***/

  /**
   * Return whether this has loaded items (so is not in 'init'|'loading'|'error' state)
   */
  isLoaded() {
    return typeof this.data !== 'string';
  }

  hasItemAmongTreeRoots(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as NavMenuData;
    return menuItems.items.some((i) => i.id === item.itemId);
  }

  hasItemAmongKnownTreeChildren(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as NavMenuData;
    return menuItems.items.some((i) => i.children && i.children.some((c) => c.id === item.itemId));
  }

}
