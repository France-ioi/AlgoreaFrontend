import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserSessionService } from './user-session.service';
import { CurrentContentService } from './current-content.service';

@Injectable({
  providedIn: 'root',
})
export class UserLanguageService {
  private sessionService = inject(UserSessionService);
  private currentContent = inject(CurrentContentService);

  /**
   * Persists the user's profile `default_language` and forces a nav-menu reload on success
   * (why this service exists: callers should not forget the reload).
   *
   * Inherits `UserSessionService.updateCurrentUser` subscribe semantics: the HTTP request starts
   * when this method is *called*, not when the result is subscribed — so nav reload only runs if
   * the returned observable is subscribed (and runs once per subscription on success).
   */
  setUserLanguage(languageTag: string): Observable<void> {
    return this.sessionService.updateCurrentUser({ default_language: languageTag }).pipe(
      tap(() => this.currentContent.forceNavMenuReload()),
    );
  }
}
