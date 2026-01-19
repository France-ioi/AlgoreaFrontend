import { Injectable, inject } from '@angular/core';
import { IdentityTokenService as IdentityTokenHttpService } from '../../data-access/identity-token.service';
import { UserSessionService } from '../user-session.service';
import { Observable, defer, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { SECONDS } from 'src/app/utils/duration';

interface TokenState {
  token: string,
  expiresAt: number,
}

@Injectable({
  providedIn: 'root'
})
export class IdentityTokenService {
  private userSessionService = inject(UserSessionService);
  private identityTokenHttpService = inject(IdentityTokenHttpService);

  private cachedToken: TokenState | null = null;

  /**
   * Observable that emits the current identity token.
   * - Waits for user profile to be available before emitting
   * - Re-fetches when user's groupId changes
   * - Re-fetches if cached token is expired (only for that subscriber)
   */
  readonly identityToken$: Observable<string> = this.userSessionService.userProfile$.pipe(
    map(user => user.groupId),
    distinctUntilChanged(),
    switchMap(() => defer(() => this.getValidToken())),
  );

  private getValidToken(): Observable<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 30 * SECONDS) {
      return of(this.cachedToken.token);
    }
    return this.identityTokenHttpService.generate().pipe(
      tap(resp => {
        this.cachedToken = {
          token: resp.identityToken,
          expiresAt: Date.now() + resp.expiresIn * SECONDS,
        };
      }),
      map(resp => resp.identityToken),
    );
  }
}
