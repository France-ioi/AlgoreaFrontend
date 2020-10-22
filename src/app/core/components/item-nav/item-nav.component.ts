import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ItemNavigationService, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { CurrentContentService, isItemInfo } from 'src/app/shared/services/current-content.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, Observable, merge, throwError, EMPTY, Subscription } from 'rxjs';
import { NavItem } from 'src/app/shared/services/nav-types';
import { ItemNavMenuData } from './item-nav-menu-data';
import { Ready, Fetching, FetchError, fetchingState, readyState, mapErrorToState, isReady, errorState } from 'src/app/shared/helpers/state';

type State = Ready<ItemNavMenuData>|Fetching|FetchError;

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: ['./item-nav.component.scss']
})
export class ItemNavComponent implements OnInit, OnDestroy {

  @Input() type: 'activity'|'skill' = 'activity';
  state: State = fetchingState();

  private subscriptions: Subscription[] = [];

  constructor(
    private itemNavService: ItemNavigationService,
    private currentContent: CurrentContentService,
  ) { }

  loadRootNav(): Observable<State> {
    return merge(
      of(fetchingState()), // first change items to loading
      this.itemNavService.getRoot(this.type).pipe(
        map(items => readyState(new ItemNavMenuData(items.items, [], undefined, items.parent))),
        mapErrorToState()
      )
    );
  }

  loadNewNav(item: NavItem): Observable<State> {
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
      of(fetchingState()), // as the menu change completely, display the loader
      dataFetcher.pipe(
        map(items => new ItemNavMenuData(items.items, item.itemPath, item, items.parent)), // the new items (only first level loaded)
        // already update the tree loaded with the first level, and if needed, load (async) children as well
        switchMap(data => merge( of(readyState(data)), this.loadChildrenIfNeeded(data) )),
        mapErrorToState(),
      )
    );
  }

  loadChildrenIfNeeded(data: ItemNavMenuData): Observable<State> {
    const selectedItem = data.selectedElement;
    if (!selectedItem) return EMPTY; // if nothing selected, no need to load more (this function should not be called in this case)

    // the selected item should be one of the items at the first level
    const itemData = data.elements.find(item => item.id === selectedItem.itemId);
    if (!itemData) return throwError(new Error('Cannot find the item (unexpected)'));
    if (!itemData.hasChildren) return EMPTY; // if no children, no need to fetch children
    if (!selectedItem.attemptId) return throwError(new Error('Cannot fetch children without attempt (unexpected'));

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(itemData.id, selectedItem.attemptId).pipe(
      map(nav => readyState(data.withUpdatedElement(itemData.id, {...nav.parent, children: nav.items }))),
      mapErrorToState()
    );
  }

  ngOnInit() {

    this.subscriptions.push(

      // This first subscription only follow change in the current item id and use switch map to cancel previous requests
      this.currentContent.currentContent$.pipe(

        // we are only interested in items
        map(content => (content !== null && isItemInfo(content) ? content.data : null)),
        // Only propagate distinct items (identified by id). Also prevent multiple null values.
        distinctUntilChanged((v1, v2) => (v1 === null && v2 === null) || ( v1 !== null && v2 !== null && v1.nav.itemId === v2.nav.itemId)),
        switchMap((item):Observable<State> => {

          if (isReady(this.state)) {

            // CASE: the current content is not an item and the menu has already items displayed -> do nothing
            if (item === null) return EMPTY;

            // CASE: the content is among the displayed items at the root of the tree -> select the right one (might load children)
            if (this.state.data.hasLevel1Element(item.nav.itemId)) {
              const newData = this.state.data.withSelection(item.nav);
              return merge(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
            }

            // CASE: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
            if (this.state.data.hasLevel2Element(item.nav.itemId)) {
              const newData = this.state.data.subNavMenuData(item.nav);
              return merge(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
            }

          } else /* not ready state */ if (item === null) {
            // CASE: the content is not an item and the menu has not already item displayed -> load item root
            return this.loadRootNav();
          }

          // CASE: the content is an item not in case 2 or 3 -> load the tree and select the right one
          return this.loadNewNav(item.nav);
        })
      ).subscribe({
        next: newState => this.state = newState,
        error: e => this.state = errorState(e),
      }),

      // If the new current item is already the selected one, just update its data (do not cancel ongoing requests)
      this.currentContent.currentContent$.pipe(
        map(content => (content !== null && isItemInfo(content) ? content.data : null)),
        switchMap(item => {
          if (item === null || !item.result) return EMPTY; // only update if result (score) is given
          if (!isReady(this.state) || this.state.data.selectedElement?.itemId !== item.nav.itemId) return EMPTY; // and same item id
          return of(this.state.data.withUpdatedElement(item.nav.itemId, {
            attemptId: item.result.attemptId,
            score: { best:  item.result.bestScore, current:  item.result.currentScore, validated: item.result.validated }
          }));
        }),
      ).subscribe(newMenuData => this.state = readyState(newMenuData)),
    );

  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}
