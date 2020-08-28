import { Injectable } from '@angular/core';
import { Observable, of, empty } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { switchMap, catchError, distinctUntilChanged } from 'rxjs/operators';
import { CurrentUserHttpService, UserProfile } from '../http-services/current-user.service';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  constructor(
    private authService: AuthService,
    private http: CurrentUserHttpService,
  ) {}

  currentUser(): Observable<UserProfile|null> {
    return this.authService.accessToken().pipe(
      switchMap((token) => {
        if (token === null) return of<UserProfile|null>(null);
        return this.http.getProfileInfo().pipe(
          catchError((_e) => empty())
        );
      }),
      distinctUntilChanged((p1, p2) => p1 === p2 || (p1 !== null && p2 !== null && p1.id === p2.id))
    );
  }

}
