import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, UrlTree } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { appDefaultItemRoute, isItemRouteError, itemRouteFromParams } from 'src/app/shared/routing/item-route';
import { errorState, FetchError, Fetching, fetchingState, Ready } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { breadcrumbServiceTag } from '../../http-services/get-breadcrumb.service';
import { GetItemPathService } from '../../http-services/get-item-path';
import { ItemDataSource, ItemData } from '../../services/item-datasource.service';
import { errorHasTag, errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { isItemInfo, itemInfo } from 'src/app/shared/models/content/item-info';

const itemBreadcrumbCat = $localize`Items`;

/**
 * ItemByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-item-by-id',
  templateUrl: './item-by-id.component.html',
  styleUrls: [ './item-by-id.component.scss' ],
  providers: [ ItemDataSource ]
})
export class ItemByIdComponent implements OnDestroy {

  // datasource state re-used with fetching/error states of route resolution
  state: Ready<ItemData>|Fetching|FetchError = fetchingState();
  // to prevent looping indefinitely in case of bug in services (wrong path > item without path > fetch path > item with path > wrong path)
  hasRedirected = false;

  readonly defaultItemRoute = this.itemRouter.urlArray(appDefaultItemRoute())

  private subscriptions: Subscription[] = []; // subscriptions to be freed up on destroy

  constructor(
    private itemRouter: ItemRouter,
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private modeService: ModeService,
    private itemDataSource: ItemDataSource,
    private resultActionsService: ResultActionsService,
    private getItemPathService: GetItemPathService,
  ) {

    // on route change: refetch item if needed
    this.activatedRoute.paramMap.subscribe(params => this.fetchItemAtRoute(params));

    this.subscriptions.push(

      // on datasource state change, update current state and current content page info
      this.itemDataSource.state$.subscribe(state => {
        this.state = state;

        if (state.isReady) {
          this.hasRedirected = false;
          this.currentContent.current.next(itemInfo({
            breadcrumbs: {
              category: itemBreadcrumbCat,
              path: state.data.breadcrumbs.map(el => ({
                title: el.title,
                hintNumber: el.attemptCnt,
                navigateTo: ():UrlTree => itemRouter.urlTree(el.route),
              })),
              currentPageIdx: state.data.breadcrumbs.length - 1,
            },
            title: state.data.item.string.title === null ? undefined : state.data.item.string.title,
            route: state.data.route,
            details: {
              title: state.data.item.string.title,
              type: state.data.item.type,
              attemptId: state.data.currentResult?.attemptId,
              bestScore: state.data.item.best_score,
              currentScore: state.data.currentResult?.score,
              validated: state.data.currentResult?.validated,
            }
          }));

        } else if (state.isError) {
          if (errorHasTag(state.error, breadcrumbServiceTag) && errorIsHTTPForbidden(state.error)) {
            if (this.hasRedirected) throw new Error('Too many redirections (unexpected)');
            this.hasRedirected = true;
            this.itemRouter.navigateToIncompleteItemOfCurrentPage();
          }
          this.currentContent.current.next(null);
        }
      }),

      this.modeService.modeActions$.pipe(
        filter(action => [ ModeAction.StartEditing, ModeAction.StopEditing ].includes(action))
      ).subscribe(action => {
        const current = this.currentContent.current.value;
        if (!isItemInfo(current)) throw new Error('Unexpected: in item-by-id but the current content is not an item');
        this.itemRouter.navigateTo(current.route, action === ModeAction.StartEditing ? 'edit' : 'details');
      }),
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  reloadContent(): void {
    this.fetchItemAtRoute(this.activatedRoute.snapshot.paramMap);
  }

  private fetchItemAtRoute(params: ParamMap): void {
    const snapshot = this.activatedRoute.snapshot;
    if (!snapshot.parent) throw new Error('Unexpected: activated route snapshot has no parent');
    if (!snapshot.parent.url.length) throw new Error('Unexpected: activated route snapshot parent has no url');
    const item = itemRouteFromParams(snapshot.parent.url[0].path, params);
    if (isItemRouteError(item)) {
      if (item.id) {
        this.state = fetchingState();
        this.solveMissingPathAttempt(item.contentType, item.id, item.path);
      } else this.state = errorState(new Error('No id in url'));
      return;
    }
    // just publish to current content the new route we are navigating to (without knowing any info)
    this.currentContent.current.next(itemInfo({ route: item, breadcrumbs: { category: itemBreadcrumbCat, path: [], currentPageIdx: -1 } }));
    // trigger the fetch of the item (which will itself re-update the current content)
    this.itemDataSource.fetchItem(item);
  }

  /**
   * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
   * Will redirect when relevant data has been fetched.
   */
  private solveMissingPathAttempt(contentType: ItemTypeCategory, id: string, path?: string[]): void {

    const pathObservable = path ? of(path) : this.getItemPathService.getItemPath(id);
    pathObservable.pipe(
      switchMap(path => {
        // for empty path (root items), consider the item has a (fake) parent attempt id 0
        if (path.length === 0) return of({ contentType: contentType, id: id, path: path, parentAttemptId: defaultAttemptId });
        // else, will start all path but the current item
        return this.resultActionsService.startWithoutAttempt(path).pipe(
          map(attemptId => ({ contentType: contentType, id: id, path: path, parentAttemptId: attemptId }))
        );
      })
    ).subscribe(
      itemRoute => this.itemRouter.navigateTo(itemRoute),
      err => {
        this.state = errorState(err);
      }
    );
  }

}
