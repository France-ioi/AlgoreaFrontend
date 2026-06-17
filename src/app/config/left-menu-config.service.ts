import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APPCONFIG, LeftMenuTabType } from '.';
import { UserSessionService } from '../services/user-session.service';
import { isUserInSet } from './user-set';

@Injectable({
  providedIn: 'root'
})
export class LeftMenuConfigService {
  private userSession = inject(UserSessionService);
  private config = inject(APPCONFIG);

  visibleTabs$: Observable<LeftMenuTabType[]> = this.userSession.session$.pipe(
    map(session => this.config.leftMenuTabs
      .filter(tab => (session === undefined ? tab.showTo === 'all' : isUserInSet(session, tab.showTo)))
      .filter(tab => this.isTabTypeAvailable(tab.type))
      .map(tab => tab.type)),
  );

  showTabBar$ = this.visibleTabs$.pipe(
    map(tabs => tabs.some(tab => tab !== 'activities')),
  );

  private isTabTypeAvailable(type: LeftMenuTabType): boolean {
    switch (type) {
      case 'skills':
        return !!this.config.defaultSkillId;
      case 'search':
        return !!this.config.searchApiUrl;
      case 'community':
        return this.config.featureFlags.community === 'enabled';
      default:
        return true;
    }
  }
}
