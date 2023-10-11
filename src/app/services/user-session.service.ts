import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, Observable, Subject, of } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { switchMap, distinctUntilChanged, map, filter, skip, shareReplay, retry } from 'rxjs/operators';
import { CurrentUserHttpService, UpdateUserBody, UserProfile } from '../data-access/current-user.service';
import { isNotUndefined } from '../utils/null-undefined-predicates';
import { repeatLatestWhen } from '../utils/operators/repeatLatestWhen';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService implements OnDestroy {

  session$ = new BehaviorSubject<UserProfile|undefined>(undefined);
  userProfileError$ = new Subject<Error>();

  /** currently-connected user profile, temporary or not, excluding transient (undefined) states */
  userProfile$ = this.session$.pipe(
    filter(isNotUndefined),
  );

  /** triggered when the user identity changes (but skipping first user value), which happens when auth token is invalidated */
  userChanged$ = this.userProfile$.pipe(distinctUntilChanged((u1, u2) => u1.groupId === u2.groupId), map(() => undefined), skip(1));

  private subscription?: Subscription;
  private userProfileUpdated$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private currentUserService: CurrentUserHttpService,
  ) {
    this.subscription = this.authService.status$.pipe(
      repeatLatestWhen(this.userProfileUpdated$),
      switchMap(auth => {
        if (!auth.authenticated) return of<UserProfile | undefined>(undefined);
        return this.currentUserService.getProfileInfo().pipe(retry(1));
      }),
      distinctUntilChanged(), // skip two undefined values in a row
    ).subscribe({
      next: profile => this.session$.next(profile),
      error: () => this.userProfileError$.next(new Error('unable to fetch user profile'))
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.session$.complete();
    this.userProfileUpdated$.complete();
  }

  isCurrentUserTemp(): boolean {
    const session = this.session$.value;
    return !session || session.tempUser;
  }

  updateCurrentUser(changes: UpdateUserBody): Observable<void> {
    const update$ = this.currentUserService.update(changes).pipe(shareReplay(1));
    update$.subscribe({
      next: () => this.userProfileUpdated$.next(),
      error: () => { /* error is handled by caller */ },
    });
    return update$;
  }

  refresh(): Observable<void> {
    const refresh$ = this.currentUserService.refresh().pipe(shareReplay(1));
    refresh$.subscribe({
      next: () => this.userProfileUpdated$.next(),
      // error has to be handled in the caller of the `refresh()` function
      error: () => {},
    });
    return refresh$;
  }

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
