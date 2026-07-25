import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSessionService } from './user-session.service';
import { setUser, addBreadcrumb, setTag } from '@sentry/angular';
import { LocaleService } from './localeService';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';

@Injectable({
  providedIn: 'root'
})
export class CrashReportingService {
  private store = inject(Store);
  private userSessionService = inject(UserSessionService);
  private localeService = inject(LocaleService);
  // Explicit DestroyRef: init() may run outside injection context, so bare takeUntilDestroyed() would fail.
  private destroyRef = inject(DestroyRef);

  init(): void {
    this.userSessionService.session$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(session => setUser(session ? { id: session.groupId, username: session.login } : null));

    this.store.select(fromObservation.selectObservedGroupId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(g => addBreadcrumb({
      category: 'group-watching',
      level: 'info',
      message: g ? 'start' : 'stop',
      data: { id: g },
    }));

    setTag('platform-lang', this.localeService.currentLang?.tag ?? '?');
  }
}
