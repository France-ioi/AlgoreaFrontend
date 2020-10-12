import { Injectable } from '@angular/core';
import { of, EMPTY } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, catchError, distinctUntilChanged } from 'rxjs/operators';
import { CurrentUserHttpService, UserProfile } from '../http-services/current-user.service';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  currentUser$ = this.authService.accessToken$.pipe(
    switchMap(token => {
      if (token === null) return of<UserProfile|undefined>(undefined);
      return this.http.getProfileInfo().pipe(
        catchError(_e => EMPTY)
      );
    }),
    distinctUntilChanged((p1, p2) => p1 === p2 || (!!p1 && !!p2 && p1.id === p2.id))
  );

  constructor(
    private authService: AuthService,
    private http: CurrentUserHttpService,
  ) {}

}
