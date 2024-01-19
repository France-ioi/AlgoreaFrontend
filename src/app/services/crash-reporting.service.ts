import { Injectable } from '@angular/core';
import { UserSessionService } from './user-session.service';
import { setUser, addBreadcrumb, setTag } from '@sentry/angular-ivy';
import { LocaleService } from './localeService';
import { Store } from '@ngrx/store';
import { fromObservation } from '../store';

@Injectable({
  providedIn: 'root'
})
export class CrashReportingService {

  constructor(
    private store: Store,
    private userSessionService: UserSessionService,
    private localeService: LocaleService,
  ){}

  init(): void {
    this.userSessionService.session$.subscribe(session => setUser(session ? { id: session.groupId, username: session.login } : null));

    // eslint-disable-next-line @ngrx/no-store-subscription
    this.store.select(fromObservation.selectGroup).subscribe(g => addBreadcrumb({
      category: 'group-watching',
      level: 'info',
      message: g ? 'start' : 'stop',
      data: g ?? undefined,
    }));

    setTag('platform-lang', this.localeService.currentLang?.tag ?? '?');
  }
}
