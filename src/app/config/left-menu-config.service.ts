import { inject, Injectable } from '@angular/core';
import { APPCONFIG } from '.'; // Adjusted path
import { UserSessionService } from '../services/user-session.service';
import { combineLatest, map, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeftMenuConfigService {
  private userSession = inject(UserSessionService);
  private config = inject(APPCONFIG);

  skillsTabEnabled$ = of({ hasDefault: !!this.config.defaultSkillId, visibilityConfig: this.config.featureFlags.leftMenu.skills }).pipe(
    switchMap(({ hasDefault, visibilityConfig }) => {
      if (!hasDefault) return of(false);
      if (!visibilityConfig.hide) return of(true);
      if (visibilityConfig.showToUserIds.length === 0) return of(false);
      return this.userSession.userProfile$.pipe(
        map(({ groupId }) => visibilityConfig.showToUserIds.includes(groupId))
      );
    })
  );
  groupsTabEnabled$ = of(this.config.featureFlags.leftMenu.groups).pipe(
    switchMap(groupsConfig => {
      if (!groupsConfig.hide) return of(true);
      if (groupsConfig.showToUserIds.length === 0) return of(false);
      return this.userSession.userProfile$.pipe(
        map(({ groupId }) => groupsConfig.showToUserIds.includes(groupId))
      );
    })
  );
  showTabBar$ = combineLatest([ this.skillsTabEnabled$, this.groupsTabEnabled$ ]).pipe(
    map(([ skillsTabEnabled, groupsTabEnabled ]) => skillsTabEnabled || groupsTabEnabled)
  );

}
