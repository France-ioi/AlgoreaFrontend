import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, EMPTY, forkJoin, Observable } from 'rxjs';
import { catchError, filter, map, retry, shareReplay, switchMap, withLatestFrom } from 'rxjs/operators';
import { ActivityNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { GetItemChildrenService, ItemChild } from 'src/app/modules/item/http-services/get-item-children.service';
import { GetItemPathService } from 'src/app/modules/item/http-services/get-item-path.service';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { isNotNull } from 'src/app/shared/helpers/null-undefined-predicates';
import {
  appendUrlWithQuery,
  fromPathKey,
  getRedirectToSubPathAtInit,
  setRedirectToSubPathAtInit,
} from 'src/app/shared/helpers/redirect-to-sub-path-at-init';
import { boolToQueryParamValue, queryParamValueToBool } from 'src/app/shared/helpers/url';
import { CheckLoginService } from 'src/app/shared/http-services/check-login.service';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { fullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { LayoutService } from 'src/app/shared/services/layout.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { LTIDataSource } from '../../services/lti-datasource.service';

enum LTIError {
  FetchError = 'fetch_error',
  NoItemOrExplicitEntryWithNoResult = 'no_item_or_explicit_entry_with_no_result',
  NoChild = 'no_child',
  LoginError = 'login_error',
}
const noItemOrExplicitEntryWithNoResultError = new Error(LTIError.NoItemOrExplicitEntryWithNoResult);
const noChildError = new Error(LTIError.NoChild);
const loginError = new Error(LTIError.LoginError);

const isRedirectionParam = 'is_redirection';
// Only handle `?from_path` query when `?lti_use_from_path=1`, ignore it otherwise
const useFromPathKey = 'lti_use_from_path';
const loginIdParam = 'user_id';

@Component({
  selector: 'alg-lti',
  templateUrl: './lti.component.html',
  styleUrls: [ './lti.component.scss' ],
})
export class LTIComponent implements OnDestroy {

  private loginId$ = this.activatedRoute.queryParamMap.pipe(map(queryParams => queryParams.get(loginIdParam)));

  private isRedirection$ = this.activatedRoute.queryParamMap.pipe(
    map(queryParams => queryParamValueToBool(queryParams.get(isRedirectionParam))),
  );

  private fromPath$ = this.activatedRoute.queryParamMap.pipe(
    map(queryParams => (queryParamValueToBool(queryParams.get(useFromPathKey)) ? queryParams.get(fromPathKey) : null)),
  );

  private contentId$ = this.activatedRoute.paramMap.pipe(
    map(params => {
      const contentId = params.get('contentId');
      if (!contentId) throw new Error('unexpected: contentId should be defined');
      return contentId;
    }),
  );

  private isLoggedIn$ = this.loginId$.pipe(
    switchMap(loginId => {
      if (!loginId) throw loginError;
      return this.checkLoginService.check(loginId);
    }),
    retry(3),
    shareReplay(1),
  );

  readonly navigationData$ = combineLatest([ this.isLoggedIn$, this.isRedirection$ ]).pipe(
    switchMap(([ isLoggedIn, isRedirection ]) => {
      if (!isLoggedIn) {
        if (isRedirection) throw loginError;
        return EMPTY;
      }
      return this.contentId$;
    }),
    switchMap(contentId => this.getNavigationData(contentId)),
    mapToFetchState(),
    shareReplay(1),
  );

  readonly error$ = this.navigationData$.pipe(
    map((state): LTIError | undefined => {
      if (!state.isError) return undefined;
      switch (state.error) {
        case noChildError: return LTIError.NoChild;
        case noItemOrExplicitEntryWithNoResultError: return LTIError.NoItemOrExplicitEntryWithNoResult;
        case loginError: return LTIError.LoginError;
        default: return LTIError.FetchError;
      }
    })
  );

  private subscriptions = [
    combineLatest([
      this.contentId$,
      this.loginId$.pipe(filter(isNotNull)),
    ]).subscribe(([ contentId, loginId ]) => {
      setRedirectToSubPathAtInit(`/lti/${contentId}?${loginIdParam}=${loginId}&${isRedirectionParam}=${boolToQueryParamValue(true)}`);
      this.activityNavTreeService.navigationNeighborsRestrictedToDescendantOfElementId = contentId;
    }),

    combineLatest([
      this.isLoggedIn$.pipe(catchError(() => EMPTY)), // error is handled elsewhere
      this.isRedirection$,
    ]).pipe(
      filter(([ isLoggedIn, isRedirection ]) => !isLoggedIn && !isRedirection),
    ).subscribe(() => this.userSession.login()), // will redirect outside the platform

    this.navigationData$
      .pipe(readyData(), withLatestFrom(this.contentId$, this.fromPath$))
      .subscribe(([{ firstChild, path, attemptId }, contentId, fromPath ]) => {
        this.ltiDataSource.data = { contentId, attemptId };

        const redirectUrl = getRedirectToSubPathAtInit();
        if (!redirectUrl) throw new Error('redirect url should be set by now');
        setRedirectToSubPathAtInit(appendUrlWithQuery(redirectUrl, useFromPathKey, boolToQueryParamValue(true)));

        if (fromPath) {
          void this.router.navigateByUrl(fromPath);
          return;
        }
        const itemRoute = fullItemRoute('activity', firstChild.id, path, { parentAttemptId: attemptId });
        this.itemRouter.navigateTo(itemRoute, { navExtras: { replaceUrl: true } });
      }),
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private router: Router,
    private userSession: UserSessionService,
    private checkLoginService: CheckLoginService,
    private layoutService: LayoutService,
    private activityNavTreeService: ActivityNavTreeService,
    private getItemPathService: GetItemPathService,
    private resultActionsService: ResultActionsService,
    private getItemChildrenService: GetItemChildrenService,
    private ltiDataSource: LTIDataSource,
  ) {
    this.layoutService.configure({ fullFrameActive: true, showTopRightControls: false, canToggleFullFrame: false });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private getNavigationData(itemId: string): Observable<{ firstChild: ItemChild, path: string[], attemptId: string }> {
    const path$ = this.getItemPathService.getItemPath(itemId).pipe(map(path => [ ...path, itemId ]), shareReplay(1));

    const attemptId$ = path$.pipe(
      switchMap(path => this.resultActionsService.startWithoutAttempt(path)),
      catchError(err => {
        // If error is http forbidden, it PROBABLY means the item requires explicit entry.
        throw errorIsHTTPForbidden(err) ? noItemOrExplicitEntryWithNoResultError : err;
      }),
      shareReplay(1),
    );

    const firstChild$ = attemptId$.pipe(
      switchMap(attemptId => this.getItemChildrenService.get(itemId, attemptId)),
      map(([ firstChild ]) => {
        if (!firstChild) throw noChildError;
        return firstChild;
      }),
    );

    return forkJoin({
      attemptId: attemptId$,
      path: path$,
      firstChild: firstChild$,
    });
  }

}
