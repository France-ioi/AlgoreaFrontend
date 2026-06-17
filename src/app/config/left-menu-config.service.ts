import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APPCONFIG, AppConfig, LeftMenuTabType } from '.';
import { UserSessionService } from '../services/user-session.service';
import { LocaleService } from '../services/localeService';
import { isUserInSet } from './user-set';

export interface LeftMenuTabView {
  id: number,
  type: LeftMenuTabType,
  icon: string,
  caption?: string,
  content?: { id: string, path: string[] },
  dataCy?: string,
}

const DEFAULT_TAB_ICONS: Record<LeftMenuTabType, string> = {
  activities: 'ph ph-presentation',
  skills: 'ph ph-graduation-cap',
  groups: 'ph ph-users',
  community: 'ph ph-users-three',
  search: 'ph ph-magnifying-glass',
};

const DEFAULT_TAB_DATA_CY: Partial<Record<LeftMenuTabType, string>> = {
  groups: 'main-menu-group-btn',
  community: 'main-menu-community-btn',
  search: 'main-menu-search-btn',
};

function resolveTabCaption(
  caption: AppConfig['leftMenuTabs'][number]['caption'],
  currentLangTag: string | undefined,
): string | undefined {
  if (!caption) return undefined;
  if (currentLangTag && currentLangTag in caption && currentLangTag !== 'default') {
    return caption[currentLangTag];
  }
  return caption.default;
}

function toTabView(
  tab: AppConfig['leftMenuTabs'][number],
  id: number,
  currentLangTag: string | undefined,
): LeftMenuTabView {
  const view: LeftMenuTabView = {
    id,
    type: tab.type,
    icon: tab.icon ?? DEFAULT_TAB_ICONS[tab.type],
    caption: resolveTabCaption(tab.caption, currentLangTag),
    dataCy: DEFAULT_TAB_DATA_CY[tab.type],
  };
  if ('content' in tab) {
    view.content = tab.content;
  }
  return view;
}

@Injectable({
  providedIn: 'root'
})
export class LeftMenuConfigService {
  private userSession = inject(UserSessionService);
  private config = inject(APPCONFIG);
  private localeService = inject(LocaleService);

  visibleTabs$: Observable<LeftMenuTabView[]> = this.userSession.session$.pipe(
    map(session => this.config.leftMenuTabs
      .filter(tab => (session === undefined ? tab.showTo === 'all' : isUserInSet(session, tab.showTo)))
      .filter(tab => this.isTabTypeAvailable(tab.type))
      .map((tab, id) => toTabView(tab, id, this.localeService.currentLang?.tag))),
  );

  showTabBar$ = this.visibleTabs$.pipe(
    map(tabs => tabs.some(tab => tab.type !== 'activities')),
  );

  private isTabTypeAvailable(type: LeftMenuTabType): boolean {
    switch (type) {
      case 'search':
        return !!this.config.searchApiUrl;
      case 'community':
        return this.config.featureFlags.community === 'enabled';
      default:
        return true;
    }
  }
}
