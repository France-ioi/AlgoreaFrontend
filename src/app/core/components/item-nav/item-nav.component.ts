import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges } from '@angular/core';
import { ItemNavigationService, NavMenuRootItem } from '../../http-services/item-navigation.service';
import { CurrentContentService, isItemInfo, ItemInfo } from 'src/app/shared/services/current-content.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, Observable, EMPTY, Subscription, concat, Subject } from 'rxjs';
import { ItemNavMenuData } from '../../common/item-nav-menu-data';
import { Ready, Fetching, FetchError, fetchingState, readyState, mapErrorToState, isReady, errorState } from 'src/app/shared/helpers/state';
import { appDefaultItemRoute, ItemRoute, ItemRouteWithParentAttempt } from 'src/app/shared/helpers/item-route';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { isSkill, ItemTypeCategory, typeCategoryOfItem } from 'src/app/shared/helpers/item-type';

type State = Ready<ItemNavMenuData>|Fetching|FetchError;
enum ChangeTrigger { Tab, Content}

@Component({
  selector: 'alg-item-nav',
  templateUrl: './item-nav.component.html',
  styleUrls: [ './item-nav.component.scss' ]
})
export class ItemNavComponent implements OnInit, OnChanges, OnDestroy {

  @Input() category: ItemTypeCategory = 'activity'; // never change the input directly, use `typeChange` to change the type category
  @Output() categoryChange = new EventEmitter<ItemTypeCategory>();

  activityState: State = fetchingState();
  skillState: State = fetchingState();

  private subscriptions: Subscription[] = [];
  private changes = new Subject<{ action: ChangeTrigger, item?: ItemInfo }>(); // follow both tab and content changes

  constructor(
    private itemNavService: ItemNavigationService,
    private resultActionService: ResultActionsService,
    private currentContent: CurrentContentService,
  ) { }

  ngOnInit(): void {

    this.subscriptions.push(

      // This first subscription only follow change in the current item id and use switch map to cancel previous requests
      this.currentContent.currentContent$.pipe(
        map(content => (content !== null && isItemInfo(content) ? content : undefined)), // we are only interested in items
        distinctUntilChanged((v1, v2) => v1 === undefined && v2 === undefined), // prevent emitting update when the content is not an item
      ).subscribe(itemInfo => this.changes.next({ action: ChangeTrigger.Content, item: itemInfo })),

      this.changes.pipe(
        switchMap((change):Observable<State> => {
          const prevState = isSkill(this.category) ? this.skillState : this.activityState;
          const itemInfo = change.item;

          if (isReady(prevState)) {
            // CASE: the current content is not an item and the menu has already items displayed
            if (!itemInfo) {
              if (prevState.data.selectedElement) return of(readyState(prevState.data.withNoSelection()));
              return EMPTY; // no change
            }

            const itemData = itemInfo.data;

            // CASE: the current content is already the selected one
            if (prevState.data.selectedElement?.id === itemData.route.id) {
              if (!itemData.details) return EMPTY;
              const newData = prevState.data.withUpdatedDetails(itemData.route.id, itemData.details);
              return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
            }

            // CASE: the content is among the displayed items at the root of the tree -> select the right one (might load children)
            if (prevState.data.hasLevel1Element(itemData.route.id)) {
              let newData = prevState.data.withSelection(itemData.route);
              if (itemData.details) newData = newData.withUpdatedDetails(itemData.route.id, itemData.details);
              return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
            }

            // CASE: the content is a child of one item at the root of the tree -> shift the tree and select it (might load children)
            if (prevState.data.hasLevel2Element(itemData.route.id)) {
              let newData = prevState.data.subNavMenuData(itemData.route);
              if (itemData.details) newData = newData.withUpdatedDetails(itemData.route.id, itemData.details);
              return concat(of(readyState(newData)), this.loadChildrenIfNeeded(newData));
            }

          } else /* not ready state */ if (!itemInfo) {
            // CASE: the content is not an item and the menu has not already item displayed -> load item root
            return this.loadDefaultNav();
          }

          // OTHERWISE: the content is an item which is not currently displayed:

          // CASE: The current content type is not known -> wait
          if (!itemInfo.data.details) return of(fetchingState());

          // CASE: The current content type does not match the current tab
          if (typeCategoryOfItem(itemInfo.data.details) !== this.category) {
            switch (change.action) {
              case ChangeTrigger.Tab:
                // if it is a user-trigger tab change, keep this tab, load the default item
                return this.loadDefaultNav();
              case ChangeTrigger.Content:
                // if the new current contest does not matches the nav menu shown, switch tab
                this.triggerCategoryChange();
                return EMPTY;
            }
          }

          // CASE: The current content type matches the current tab
          return this.loadNewNav(itemInfo.data.route);
        })
      ).subscribe({
        // As an update of `category` triggers a change and as switchMap ensures ongoing requests are cancelled when a new change happens,
        // the state updated here is on the same category as `prevState` above.
        next: newState => this.updateCurrentState(newState),
        error: e => this.updateCurrentState(errorState(e)),
      }),

    );

  }

  ngOnChanges(): void {
    const currentContent = this.currentContent.current.value;
    this.changes.next({ action: ChangeTrigger.Tab, item: isItemInfo(currentContent) ? currentContent : undefined });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  updateCurrentState(state: State): void {
    if (isSkill(this.category)) this.skillState = state;
    else this.activityState = state;
  }

  triggerCategoryChange(): void {
    if (isSkill(this.category)) this.categoryChange.emit('activity');
    else this.categoryChange.emit('skill');
  }

  loadDefaultNav(): Observable<State> {
    const route = appDefaultItemRoute(this.category);
    return concat(
      of(fetchingState()),
      this.itemNavService.getRoot(this.category).pipe(
        map(items => new ItemNavMenuData(items.items, [], undefined, undefined, [ route.id ])),
        switchMap(menuData => concat(of(readyState(menuData)), this.startResultAndLoadChildren(menuData, route))),
        mapErrorToState()
      )
    );
  }

  startResultAndLoadChildren(data: ItemNavMenuData, item: ItemRouteWithParentAttempt): Observable<State> {
    const menuItem = data.elements.find(i => i.id === item.id);
    if (!menuItem) return of(errorState(new Error('Cannot find the default item in root')));
    const dataWithFetchedAttempt = menuItem.attemptId !== null ? of(data) :
      this.resultActionService.start(item.path.concat([ item.id ]), item.parentAttemptId).pipe(
        map(() => data.withUpdatedAttemptId(item.id, item.parentAttemptId))
      );
    return dataWithFetchedAttempt.pipe(
      switchMap(dataWithAttempt => {
        const newMenuItem = dataWithAttempt.elements.find(i => i.id === item.id);
        return this.loadChildrenIfNeeded(dataWithAttempt, newMenuItem);
      })
    );
  }

  loadNewNav(item: ItemRoute): Observable<State> {
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
        map(items => new ItemNavMenuData(items.items, item.path, item, items.parent)), // the new items (only first level loaded)
        // already update the tree loaded with the first level, and if needed, load (async) children as well
        switchMap(data => concat(of(readyState(data)), this.loadChildrenIfNeeded(data))),
        mapErrorToState(),
      )
    );
  }

  /**
   * Load children of the given item if it has children and has an attempt
   */
  loadChildrenIfNeeded(data: ItemNavMenuData, item = data.selectedNavMenuItem()): Observable<State> {
    if (!item) return of(errorState(new Error('Cannot find selected element (or no selection) (unexpected)')));
    if (!item.hasChildren || item.attemptId === null) return EMPTY; // if no children, no need to fetch children

    // We do not check if children were already known. So we might re-load again the same children, which is intended.
    return this.itemNavService.getNavData(item.id, item.attemptId, isSkill(this.category)).pipe(
      map(nav => readyState(data.withUpdatedInfo(item.id, nav.parent, nav.items))),
      mapErrorToState()
    );
  }

}
