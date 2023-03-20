import { Injectable } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupWatchingService } from './group-watching.service';
import { setUser, addBreadcrumb, setTag, setTags } from '@sentry/angular-ivy';
import { LocaleService } from './localeService';
import { LayoutService } from 'src/app/shared/services/layout.service';

@Injectable({
  providedIn: 'root'
})
export class CrashReportingService {

  constructor(
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
  ){}

  init(): void {
    this.userSessionService.session$.subscribe(session => setUser(session ? { id: session.groupId, username: session.login } : null));

    this.groupWatchingService.watchedGroup$.subscribe(g => addBreadcrumb({
      category: 'group-watching',
      level: 'info',
      message: g ? 'start' : 'stop',
      data: g ?? undefined,
    }));

    this.layoutService.fullFrame$.subscribe(ffc => setTags({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'full-frame.active': ffc.active,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'full-frame.can-toggle': ffc.canToggle,
    }));

    setTag('platform-lang', this.localeService.currentLang?.tag ?? '?');
  }
}
