import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { EMPTY, Subscription } from 'rxjs';
import { filter, map, pairwise, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { HOURS, SECONDS } from 'src/app/utils/duration';
import { ItemTaskService } from '../../services/item-task.service';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { LTIDataSource } from 'src/app/lti/lti-datasource.service';
import { PublishResultsService } from '../../data-access/publish-result.service';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';
import { ActivityNavTreeService } from 'src/app/services/navigation/item-nav-tree.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { openNewTab, replaceWindowUrl } from 'src/app/utils/url';
import { GetBreadcrumbsFromRootsService } from 'src/app/data-access/get-breadcrumbs-from-roots.service';
import { typeCategoryOfItem } from 'src/app/items/models/item-type';
import { closestBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { FullItemRoute, itemRoute } from 'src/app/models/routing/item-route';
import { UnlockedItems } from 'src/app/items/data-access/grade.service';

export interface ItemDisplaySideEffectDeps {
  taskService: ItemTaskService,
  actionFeedbackService: ActionFeedbackService,
  publishResultService: PublishResultsService,
  ltiDataSource: LTIDataSource,
  activityNavTreeService: ActivityNavTreeService,
  router: Router,
  itemRouter: ItemRouter,
  location: Location,
  breadcrumbsService: GetBreadcrumbsFromRootsService,
  route: () => FullItemRoute,
  openUnlockedItemsDialog: (items: UnlockedItems) => void,
}

// Kept as explicit subscriptions: saveAnswerAndState() unsubscribes them all early on purpose.
export function createItemDisplaySideEffectSubscriptions(deps: ItemDisplaySideEffectDeps): Subscription[] {
  return [
    deps.taskService.autoSaveResult$
      .pipe(startWith(true), pairwise())
      .subscribe(([ previous, next ]) => {
        const shouldDisplayError = !next && !deps.actionFeedbackService.hasFeedback;
        const shouldDisplaySuccess = !previous && next;
        if (shouldDisplayError) {
          const message = $localize`Your current progress could not be saved. Are you connected to the internet?`;
          deps.actionFeedbackService.error(message, { life: 24*HOURS });
        }
        if (shouldDisplaySuccess) {
          deps.actionFeedbackService.clear();
          deps.actionFeedbackService.success($localize`Progress saved!`);
        }
      }),

    deps.taskService.scoreChange$.pipe(
      switchMap(() => {
        if (!deps.ltiDataSource.data) return EMPTY;
        return deps.publishResultService.publish(deps.ltiDataSource.data.contentId, deps.ltiDataSource.data.attemptId);
      }),
    ).subscribe({
      error: err => {
        const message = errorIsHTTPForbidden(err)
          ? $localize`You might be unauthenticated anymore, please try relaunching the exercise. If the problem persits contact us.`
          : $localize`An unknown error occurred while publishing your result`;
        deps.actionFeedbackService.error(message, { life: 10*SECONDS });
      }
    }),

    deps.taskService.hintError$.subscribe(() => deps.actionFeedbackService.error($localize`Hint request failed`)),

    deps.taskService.navigateTo$.pipe(
      filter(dst => 'nextActivity' in dst),
      withLatestFrom(deps.activityNavTreeService.navigationNeighbors$.pipe(readyData())),
    ).subscribe(([ , navNeighbors ]) => (navNeighbors?.next ?? navNeighbors?.parent)?.navigateTo()),

    deps.taskService.navigateTo$.pipe(
      filter((d): d is ({ id: string, path: string[] }|{ url: string })&{ newTab: boolean} => 'url' in d || ('id' in d && !!d.path))
    ).subscribe(dst => {
      if ('id' in dst) {
        const route = itemRoute('activity', dst.id, { path: dst.path });
        if (dst.newTab) openNewTab(deps.router.serializeUrl(deps.itemRouter.url(route)), deps.location);
        else deps.itemRouter.navigateTo(route, { useCurrentObservation: true });
      }
      if ('url' in dst) {
        if (dst.newTab) openNewTab(dst.url, deps.location);
        else replaceWindowUrl(dst.url, deps.location);
      }
    }),

    deps.taskService.navigateTo$.pipe(
      filter((dst): dst is ({ id: string }|{ textId: string })&{ newTab: boolean} => ('id' in dst && !dst.path) || 'textId' in dst),
      switchMap(dst => {
        const getBreadcrumbs$ = 'id' in dst ? deps.breadcrumbsService.get(dst.id) : deps.breadcrumbsService.getByTextId(dst.textId);
        return getBreadcrumbs$.pipe(map(breadcrumbs => ({ breadcrumbs, newTab: dst.newTab })), mapToFetchState());
      }),
    ).subscribe(state => {
      if (state.isError) {
        if (errorIsHTTPForbidden(state.error)) deps.actionFeedbackService.error($localize`You cannot access this page.`);
        else deps.actionFeedbackService.error($localize`Unable to get linked page information. If the problem persists, contact us.`);
      }
      if (state.isReady) {
        const breadcrumbs = closestBreadcrumbs(deps.route().path, state.data.breadcrumbs);
        const lastElement = breadcrumbs.pop();
        if (!lastElement) throw new Error('unexpected: get all breadcrumbs services are expected to return non-empty breadcrumbs');
        const route = itemRoute(typeCategoryOfItem(lastElement), lastElement.id, { path: breadcrumbs.map(b => b.id) });
        if (state.data.newTab) openNewTab(deps.router.serializeUrl(deps.itemRouter.url(route)), deps.location);
        else deps.itemRouter.navigateTo(route, { useCurrentObservation: true });
      }
    }),

    deps.taskService.unlockedItems$.subscribe(items => deps.openUnlockedItemsDialog(items)),
  ];
}
