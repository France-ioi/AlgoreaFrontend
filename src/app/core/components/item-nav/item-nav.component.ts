import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ItemNavigationService, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { CurrentContentService, isItemInfo } from 'src/app/shared/services/current-content.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, Observable, merge, throwError, EMPTY, Subscription } from 'rxjs';
import { NavItem } from 'src/app/shared/services/nav-types';
import { ItemNavMenuData } from './item-nav-menu-data';

type NavMenuDataState = 'init'|'loading'|'error'|ItemNavMenuData;

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
        map(items => new ItemNavMenuData(items.items, [], undefined, items.parent))
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
        map(items => new ItemNavMenuData(items.items, item.itemPath, item, items.parent)), // the new items (only first level loaded)
        // already update the tree loaded with the first level, and if needed, load (async) children as well
        switchMap(data => merge( of(data), this.loadChildrenIfNeeded(data) )),
      )
    );
  }

  loadChildrenIfNeeded(data: ItemNavMenuData): Observable<NavMenuDataState> {
    const selectedItem = data.selectedElement;
    if (!selectedItem) return EMPTY; // if nothing selected, no need to load more (this function should not be called in this case)

    // the selected item should be one of the items at the first level
    const itemData = data.elements.find(item => item.id === selectedItem.itemId);
    if (!itemData) return throwError(new Error('Cannot find the item (unexpected)'));
    if (!itemData.hasChildren) return EMPTY; // if no children, no need to fetch children
    if (!selectedItem.attemptId) return throwError(new Error('Cannot fetch children without attempt (unexpected'));

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(itemData.id, selectedItem.attemptId).pipe(
      map(nav => data.withUpdatedElement(itemData.id, {...nav.parent, children: nav.items }))
    );
  }

  /**
   * `item` is one of the children of one root item. Replace the current tree parent by this root item and the root items by
   * its children (including item).
   * Then load 'item' 's children  if it has some.
   */
  treeShiftedToChild(item: NavItem): Observable<NavMenuDataState> {
    const menuItems = this.data as ItemNavMenuData;
    const newData = menuItems.subNavMenuData(item);
    return merge(of(newData), this.loadChildrenIfNeeded(newData));
  }

  ngOnInit() {

    this.subscriptions.push(

      // This first subscription only follow change in the current item id and use switch map to cancel previous requests
      this.currentContent.currentContent$.pipe(

        // we are only interested in items
        map(content => (content !== null && isItemInfo(content) ? content.data : null)),
        // Only propagate distinct items (identified by id). Also prevent multiple null values.
        distinctUntilChanged((v1, v2) => (v1 === null && v2 === null) || ( v1 !== null && v2 !== null && v1.nav.itemId === v2.nav.itemId)),
        switchMap((item):Observable<NavMenuDataState> => {

          // CASE 0: the current content is not an item and the menu has already items displayed -> do nothing
          if (item === null && this.isLoaded()) return EMPTY;

          // CASE 1: the content is not an item and the menu has not already item displayed -> load item root
          if (item === null) {
            return this.loadRootNav();
          }

          // CASE 2: the content is among the displayed items at the root of the tree -> select the right one (might load children)
          if (this.hasItemAmongTreeRoots(item.nav)) {
            const data = (this.data as ItemNavMenuData).withSelection(item.nav);
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
        if (item !== null && this.isLoaded() && (this.data as ItemNavMenuData).selectedElement?.itemId === item.nav.itemId) {
          // only update in case 'result' (the score) is given
          if (item.result) this.data = (this.data as ItemNavMenuData).withUpdatedElement(
            item.nav.itemId,
            {
              attemptId: item.result.attemptId,
              score: { best:  item.result.bestScore, current:  item.result.currentScore, validated: item.result.validated }
            }
          );
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

  hasItemAmongTreeRoots(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as ItemNavMenuData;
    return menuItems.hasLevel1Element(item.itemId);
  }

  hasItemAmongKnownTreeChildren(item: NavItem): boolean {
    if (!this.isLoaded()) return false;
    const menuItems = this.data as ItemNavMenuData;
    return menuItems.hasLevel2Element(item.itemId);
  }

}
