import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, BehaviorSubject, Subscription, Observable, Subject, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, catchError, distinctUntilChanged, map, filter, tap, mapTo, skip } from 'rxjs/operators';
import { CurrentUserHttpService, UpdateUserBody, UserProfile } from '../http-services/current-user.service';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { isNotUndefined } from '../helpers/null-undefined-predicates';
import { repeatLatestWhen } from '../helpers/repeatLatestWhen';

export interface UserSession {
  user: UserProfile,
  watchedGroup?: Group,
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService implements OnDestroy {

  session$ = new BehaviorSubject<UserSession|undefined>(undefined)
  watchedGroup$ = this.session$.pipe(map(session => session?.watchedGroup), distinctUntilChanged())

  /** currently-connected user profile, temporary or not, excluding transient (undefined) states */
  userProfile$ = this.session$.pipe(
    filter(isNotUndefined),
    map(session => session.user),
  );

  /** triggered when the user identity changes, which happens when auth token is invalidated */
  userChanged$ = this.userProfile$.pipe(distinctUntilChanged((u1, u2) => u1.groupId === u2.groupId), mapTo(undefined), skip(1))

  private subscription?: Subscription;
  private refresh$ = new Subject<void>()

  constructor(
    private authService: AuthService,
    private currentUserService: CurrentUserHttpService,
  ) {
    this.subscription = this.authService.status$.pipe(
      repeatLatestWhen(this.refresh$),
      switchMap(auth => {
        if (!auth.authenticated) return of<UserProfile | undefined>(undefined);
        return this.currentUserService.getProfileInfo().pipe(
          catchError(_e => EMPTY)
        );
      }),
      distinctUntilChanged(), // skip two undefined values in a row
    ).subscribe(profile => {
      this.session$.next(profile ? { user: profile } : undefined);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.session$.complete();
    this.refresh$.complete();
  }

  startGroupWatching(group: Group): void {
    const user = this.session$.value?.user;
    if (!user) return; // unexpected
    this.session$.next({ user: user, watchedGroup: group });
  }

  stopGroupWatching(): void {
    const user = this.session$.value?.user;
    if (!user) return; // unexpected
    this.session$.next({ user: user });
  }

  isCurrentUserTemp(): boolean {
    const session = this.session$.value;
    return !session || session.user.tempUser;
  }

  updateCurrentUser(changes: UpdateUserBody): Observable<void> {
    return this.currentUserService.update(changes).pipe(
      tap(() => {
        this.refresh$.next();
      }),
    );
  }

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
