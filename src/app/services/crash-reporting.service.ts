import { Injectable } from '@angular/core';
import { UserSessionService } from './user-session.service';
import { GroupWatchingService } from './group-watching.service';
import { setUser, addBreadcrumb, setTag } from '@sentry/angular-ivy';
import { LocaleService } from './localeService';

@Injectable({
  providedIn: 'root'
})
export class CrashReportingService {

  constructor(
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private localeService: LocaleService,
  ){}

  init(): void {
    this.userSessionService.session$.subscribe(session => setUser(session ? { id: session.groupId, username: session.login } : null));

    this.groupWatchingService.watchedGroup$.subscribe(g => addBreadcrumb({
      category: 'group-watching',
      level: 'info',
      message: g ? 'start' : 'stop',
      data: g ?? undefined,
    }));

    setTag('platform-lang', this.localeService.currentLang?.tag ?? '?');
  }
}
