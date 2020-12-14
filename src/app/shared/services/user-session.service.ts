import { Injectable, OnDestroy } from '@angular/core';
import { of, EMPTY, BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, catchError, distinctUntilChanged } from 'rxjs/operators';
import { CurrentUserHttpService, UserProfile } from '../http-services/current-user.service';
import { Group } from 'src/app/core/components/group-nav-tree/group';

export interface UserSession {
  user: UserProfile,
  watchedGroup?: Group,
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService implements OnDestroy {

  session$ = new BehaviorSubject<UserSession|undefined>(undefined)

  currentUser$ = this.authService.accessToken$.pipe(
    switchMap(token => {
      if (token === null) return of<UserProfile|undefined>(undefined);
      return this.http.getProfileInfo().pipe(
        catchError(_e => EMPTY)
      );
    }),
    distinctUntilChanged((p1, p2) => p1 === p2 || (!!p1 && !!p2 && p1.id === p2.id))
  );

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private http: CurrentUserHttpService,
  ) {
    this.subscriptions.push(
      // changing user clears out the watched group if any
      this.currentUser$.subscribe(u => this.session$.next(u ? { user: u } : undefined)),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
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

}
