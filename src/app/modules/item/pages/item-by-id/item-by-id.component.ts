import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, UrlTree } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, pairwise, startWith, switchMap, take } from 'rxjs/operators';
import { defaultAttemptId } from 'src/app/shared/helpers/attempts';
import { errorState, fetchingState, FetchState } from 'src/app/shared/helpers/state';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { breadcrumbServiceTag } from '../../http-services/get-breadcrumb.service';
import { GetItemPathService } from '../../http-services/get-item-path.service';
import { ItemDataSource, ItemData } from '../../services/item-datasource.service';
import { errorHasTag, errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/shared/helpers/errors';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { isTask, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import { itemInfo } from 'src/app/shared/models/content/item-info';
import { repeatLatestWhen } from 'src/app/shared/helpers/repeatLatestWhen';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { isItemRouteError, itemRouteFromParams } from './item-route-validation';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { readyData } from 'src/app/shared/operators/state';
import { ensureDefined } from 'src/app/shared/helpers/assert';
import { routeWithSelfAttempt } from 'src/app/shared/routing/item-route';

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
  state: FetchState<ItemData> = fetchingState();
  // to prevent looping indefinitely in case of bug in services (wrong path > item without path > fetch path > item with path > wrong path)
  hasRedirected = false;

  private subscriptions: Subscription[] = []; // subscriptions to be freed up on destroy

  constructor(
    private itemRouter: ItemRouter,
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private userSessionService: UserSessionService,
    private resultActionsService: ResultActionsService,
    private getItemPathService: GetItemPathService,
    private layoutService: LayoutService,
  ) {

    // on route change or user change: refetch item if needed
    this.activatedRoute.paramMap.pipe(
      repeatLatestWhen(this.userSessionService.userChanged$),
      // When loading a task with a former answerId, we need to remove the answerId from the url to avoid reloading
      // a former answer if the user refreshes the page
      // However, replacing the url should not retrigger an item fetch either, thus the use of history.state.preventRefetch
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions
      filter(() => !(typeof history.state === 'object' && history.state?.preventRefetch)),
    ).subscribe(params => this.fetchItemAtRoute(params)),

    this.subscriptions.push(
      // on datasource state change, update current state and current content page info
      this.itemDataSource.state$.subscribe(state => {
        this.state = state;

        if (state.isReady) {
          this.hasRedirected = false;
          this.currentContent.replace(itemInfo({
            breadcrumbs: {
              category: itemBreadcrumbCat,
              path: state.data.breadcrumbs.map(el => ({
                title: el.title,
                hintNumber: el.attemptCnt,
                navigateTo: ():UrlTree => itemRouter.url(el.route),
              })),
              currentPageIdx: state.data.breadcrumbs.length - 1,
            },
            title: state.data.item.string.title === null ? undefined : state.data.item.string.title,
            route: routeWithSelfAttempt(state.data.route, state.data.currentResult?.attemptId),
            details: {
              title: state.data.item.string.title,
              type: state.data.item.type,
              attemptId: state.data.currentResult?.attemptId,
              bestScore: state.data.item.watchedGroup ? state.data.item.watchedGroup.averageScore : state.data.item.bestScore,
              currentScore: state.data.item.watchedGroup ? state.data.item.watchedGroup.averageScore : state.data.currentResult?.score,
              validated: state.data.item.watchedGroup ?
                state.data.item.watchedGroup.averageScore === 100 : state.data.currentResult?.validated,
            },
          }));

          if (state.data.route.answerId) {
            this.itemRouter.navigateTo(
              { ...state.data.route, answerId: undefined },
              { navExtras: { replaceUrl: true, state: { preventRefetch: true } } },
            );
          }

        } else if (state.isError) {
          // If path is incorrect, redirect to same page without path to trigger the solve missing path at next navigation
          if (errorHasTag(state.error, breadcrumbServiceTag) && (errorIsHTTPForbidden(state.error) || errorIsHTTPNotFound(state.error))) {
            if (this.hasRedirected) throw new Error('Too many redirections (unexpected)');
            this.hasRedirected = true;
            const { contentType, id, answerId } = this.getItemRoute();
            if (!id) throw new Error('Unexpected: item id should exist');
            this.itemRouter.navigateTo({ contentType, id, answerId }, { navExtras: { replaceUrl: true } });
          }
          this.currentContent.clear();
        }
      }),

      this.itemDataSource.state$.pipe(
        readyData(),
        distinctUntilChanged((a, b) => a.item.id === b.item.id),
        startWith(undefined),
        pairwise(),
        filter(([ previous, current ]) => (!!current && (!previous || isTask(previous.item) || isTask(current.item)))),
        map(([ , current ]) => ensureDefined(current).item),
      ).subscribe(item => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions
        const activateFullFrame = isTask(item) && !(typeof history.state === 'object' && history.state?.preventFullFrame);
        this.layoutService.configure({ fullFrameActive: activateFullFrame });
      })
    );
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.subscriptions.forEach(s => s.unsubscribe());
    this.layoutService.fullFrame$
      .pipe(take(1), filter(fullFrame => fullFrame.active)) // if layout is in full frame and we quit an item page => disable full frame
      .subscribe(() => this.layoutService.configure({ fullFrameActive: false }));
  }

  private getItemRoute(params?: ParamMap): ReturnType<typeof itemRouteFromParams> {
    const snapshot = this.activatedRoute.snapshot;
    if (!snapshot.parent) throw new Error('Unexpected: activated route snapshot has no parent');
    if (!snapshot.parent.url[0]) throw new Error('Unexpected: activated route snapshot parent has no url');
    return itemRouteFromParams(snapshot.parent.url[0].path, params ?? snapshot.paramMap);
  }

  private fetchItemAtRoute(params: ParamMap): void {
    const item = this.getItemRoute(params);
    if (isItemRouteError(item)) {
      if (item.id) {
        this.state = fetchingState();
        this.solveMissingPathAttempt(item.contentType, item.id, item.path, item.answerId);
      } else this.state = errorState(new Error('No id in url'));
      return;
    }
    // just publish to current content the new route we are navigating to (without knowing any info)
    this.currentContent.replace(itemInfo({ route: item, breadcrumbs: { category: itemBreadcrumbCat, path: [], currentPageIdx: -1 } }));
    // trigger the fetch of the item (which will itself re-update the current content)
    this.itemDataSource.fetchItem(item);
  }

  /**
   * Called when either path or attempt is missing. Will fetch the path if missing, then will be fetch the attempt.
   * Will redirect when relevant data has been fetched.
   */
  private solveMissingPathAttempt(contentType: ItemTypeCategory, id: string, path?: string[], answerId?: string): void {

    const pathObservable = path ? of(path) : this.getItemPathService.getItemPath(id);
    pathObservable.pipe(
      switchMap(path => {
        // for empty path (root items), consider the item has a (fake) parent attempt id 0
        if (path.length === 0) return of({ contentType, id, path, parentAttemptId: defaultAttemptId, answerId });
        // else, will start all path but the current item
        return this.resultActionsService.startWithoutAttempt(path).pipe(
          map(attemptId => ({ contentType, id, path, parentAttemptId: attemptId, answerId }))
        );
      })
    ).subscribe({
      next: itemRoute => this.itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } }),
      error: err => {
        this.state = errorState(err);
        this.layoutService.configure({ fullFrameActive: false });
        this.currentContent.clear();
      }
    });
  }

}
