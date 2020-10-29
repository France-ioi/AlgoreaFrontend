import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ItemNavigationService, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { CurrentContentService, isItemInfo } from 'src/app/shared/services/current-content.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, Observable, EMPTY, Subscription, concat } from 'rxjs';
import { ItemNavMenuData } from '../../common/item-nav-menu-data';
import { Ready, Fetching, FetchError, fetchingState, readyState, mapErrorToState, isReady, errorState } from 'src/app/shared/helpers/state';
import { ItemRoute } from 'src/app/shared/helpers/item-route';

type State = Ready<ItemNavMenuData>|Fetching|FetchError;

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: [ './item-nav.component.scss' ]
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
    return concat(
      of(fetchingState()), // first change items to loading
      this.itemNavService.getRoot(this.type).pipe(
        map(items => readyState(new ItemNavMenuData(items.items, [], undefined, items.parent))),
        mapErrorToState()
      )
    );
  }

  loadNewNav(item: ItemRoute): Observable<State> {
    let dataFetcher: Observable<NavMenuRootItem>;
    if (item.path.length >= 1) {
      const parentId = item.path[item.path.length-1];
      dataFetcher = this.itemNavService.getNavDataFromChildRoute(parentId, item);
    } else {
      dataFetcher = this.itemNavService.getRoot(this.type);
    }
    return concat(
      of(fetchingState()), // as the menu change completely, display the loader
      dataFetcher.pipe(
        map(items => new ItemNavMenuData(items.items, item.path, item, items.parent)), // the new items (only first level loaded)
        // already update the tree loaded with the first level, and if needed, load (async) children as well
        switchMap(data => concat(of(readyState(data)), this.loadChildrenIfNeeded(data))),
        mapErrorToState(),
      )
    );
  }

  loadChildrenIfNeeded(data: ItemNavMenuData): Observable<State> {
    const selected = data.selectedNavMenuItem();
    if (!selected) return of(errorState(new Error('Cannot find selected element (or no selection) (unexpected)')));
    if (!selected.hasChildren || selected.attemptId === null) return EMPTY; // if no children, no need to fetch children

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(selected.id, selected.attemptId).pipe(
      map(nav => readyState(data.withUpdatedInfo(selected.id, nav.parent, nav.items))),
      mapErrorToState()
    );
  }

  ngOnInit(): void {

    this.subscriptions.push(

      // This first subscription only follow change in the current item id and use switch map to cancel previous requests
      this.currentContent.currentContent$.pipe(

        // we are only interested in items
        map(content => (content !== null && isItemInfo(content) ? content.data : null)),
        distinctUntilChanged((v1, v2) => v1 === null && v2 === null), // only prevent multiple null values
        switchMap((item):Observable<State> => {

          if (isReady(this.state)) {

            // CASE: the current content is not an item and the menu has already items displayed -> do nothing
            if (item === null) return EMPTY;

            // CASE: the current content is already the selected one
            if (this.state.data.selectedElement?.id === item.route.id) {
              if (!item.details) return EMPTY;
              const newData = this.state.data.withUpdatedDetails(item.route.id, item.details);
              return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
            }

            // CASE: the content is among the displayed items at the root of the tree -> select the right one (might load children)
            if (this.state.data.hasLevel1Element(item.route.id)) {
              const newData = this.state.data.withSelection(item.route);
              return of(readyState(newData));
            }

            // CASE: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
            if (this.state.data.hasLevel2Element(item.route.id)) {
              const newData = this.state.data.subNavMenuData(item.route);
              return of(readyState(newData));
            }

          } else /* not ready state */ if (item === null) {
            // CASE: the content is not an item and the menu has not already item displayed -> load item root
            return this.loadRootNav();
          }

          // CASE: the content is an item which is not current display -> load the tree and select the right one
          return this.loadNewNav(item.route);
        })
      ).subscribe({
        next: newState => this.state = newState,
        error: e => this.state = errorState(e),
      }),

    );

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}
