import { Injectable, OnDestroy } from '@angular/core';
import { of, EMPTY, BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, catchError, distinctUntilChanged, map, filter } from 'rxjs/operators';
import { CurrentUserHttpService, UserProfile } from '../http-services/current-user.service';
import { Group } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { isNotUndefined } from '../helpers/null-undefined-predicates';

export interface UserSession {
  user: UserProfile,
  watchedGroup?: Group,
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService implements OnDestroy {

  session$ = new BehaviorSubject<UserSession|undefined>(undefined)

  /** currently-connected user profile, temporary or not, excluding transient (undefined) states */
  user$ = this.session$.pipe(
    filter(isNotUndefined),
    map(session => session.user),
    distinctUntilChanged((u1, u2) => u1.groupId === u2.groupId)
  );

  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private http: CurrentUserHttpService,
  ) {
    this.subscription = this.authService.accessToken$.pipe(
      switchMap(token => {
        if (token === null) return of<UserProfile|undefined>(undefined);
        return this.http.getProfileInfo().pipe(
          catchError(_e => EMPTY)
        );
      }),
      distinctUntilChanged((p1, p2) => p1 === p2 || (!!p1 && !!p2 && p1.groupId === p2.groupId))
    ).subscribe(profile => {
      this.session$.next(profile ? { user: profile } : undefined);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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

  login(): void {
    this.authService.startAuthLogin();
  }

  logout(): void {
    this.authService.logoutAuthUser();
  }

}
