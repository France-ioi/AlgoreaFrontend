import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { OAuthStorageUnavailableError } from './auth/oauth.service';
import { switchMap, distinctUntilChanged, map, filter, skip, shareReplay, retry } from 'rxjs/operators';
import { CurrentUserHttpService, UpdateUserBody, CurrentUserProfile } from '../data-access/current-user.service';
import { isNotUndefined } from '../utils/null-undefined-predicates';
import { repeatLatestWhen } from '../utils/operators/repeatLatestWhen';
import { ActionFeedbackService } from './action-feedback.service';
import { SECONDS } from '../utils/duration';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService implements OnDestroy {
  private authService = inject(AuthService);
  private currentUserService = inject(CurrentUserHttpService);
  private actionFeedbackService = inject(ActionFeedbackService);
  // Explicit DestroyRef: updateCurrentUser/refresh subscribe outside injection context, so bare takeUntilDestroyed() would fail.
  private destroyRef = inject(DestroyRef);

  session$ = new BehaviorSubject<CurrentUserProfile|undefined>(undefined);
  userProfileError$ = new Subject<Error>();

  /** currently-connected user profile, temporary or not, excluding transient (undefined) states */
  userProfile$ = this.session$.pipe(
    filter(isNotUndefined),
  );

  /** triggered when the user identity changes (but skipping first user value), which happens when auth token is invalidated */
  userChanged$ = this.userProfile$.pipe(distinctUntilChanged((u1, u2) => u1.groupId === u2.groupId), map(() => undefined), skip(1));

  private userProfileUpdated$ = new Subject<void>();

  constructor() {
    this.authService.status$.pipe(
      repeatLatestWhen(this.userProfileUpdated$),
      switchMap(auth => {
        if (!auth.authenticated) return of<CurrentUserProfile | undefined>(undefined);
        return this.currentUserService.getProfileInfo().pipe(retry(1));
      }),
      distinctUntilChanged(), // skip two undefined values in a row
      takeUntilDestroyed(),
    ).subscribe({
      next: profile => this.session$.next(profile),
      error: () => this.userProfileError$.next(new Error('unable to fetch user profile'))
    });
  }

  ngOnDestroy(): void {
    this.session$.complete();
    this.userProfileUpdated$.complete();
  }

  isCurrentUserTemp(): boolean {
    const session = this.session$.value;
    return !session || session.tempUser;
  }

  updateCurrentUser(changes: UpdateUserBody): Observable<void> {
    const update$ = this.currentUserService.update(changes).pipe(shareReplay(1));
    update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.userProfileUpdated$.next(),
      error: () => { /* error is handled by caller */ },
    });
    return update$;
  }

  refresh(): Observable<void> {
    const refresh$ = this.currentUserService.refresh().pipe(shareReplay(1));
    refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.userProfileUpdated$.next(),
      // error has to be handled in the caller of the `refresh()` function
      error: () => {},
    });
    return refresh$;
  }

  login(): void {
    try {
      this.authService.startAuthLogin();
    } catch (err) {
      if (err instanceof OAuthStorageUnavailableError) {
        // Longer than the default 5s toast so the user can read the recovery instructions.
        this.actionFeedbackService.error($localize`Unable to sign in: your browser is blocking storage for this site. \
Please allow cookies and site data (or disable strict tracking protection for this site), then try again.`, {
          life: 20 * SECONDS,
        });
        return;
      }
      throw err;
    }
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
