import { Component, computed, input, output } from '@angular/core';
import { LeftMenuTabType } from '../../config';

interface LeftMenuTabView {
  type: LeftMenuTabType,
  icon: string,
  dataCy?: string,
}

const TAB_VIEWS: Record<LeftMenuTabType, Omit<LeftMenuTabView, 'type'>> = {
  activities: { icon: 'ph ph-presentation' },
  skills: { icon: 'ph ph-graduation-cap' },
  groups: { icon: 'ph ph-users', dataCy: 'main-menu-group-btn' },
  community: { icon: 'ph ph-users-three', dataCy: 'main-menu-community-btn' },
  search: { icon: 'ph ph-magnifying-glass', dataCy: 'main-menu-search-btn' },
};

@Component({
  selector: 'alg-left-tab-bar',
  templateUrl: './left-tab-bar.component.html',
  styleUrls: [ './left-tab-bar.component.scss' ],
})
export class LeftTabBarComponent {
  tabs = input<LeftMenuTabType[]>([]);
  activeTab = input<LeftMenuTabType | null>(null);
  hasUnreadCommunityThreads = input(false);
  searchActive = input(false);

  tabSelected = output<LeftMenuTabType>();
  searchSelected = output<void>();

  tabViews = computed(() => this.tabs().map(type => ({ type, ...TAB_VIEWS[type] })));

  isTabActive(tab: LeftMenuTabView): boolean {
    if (tab.type === 'search') {
      return this.searchActive();
    }
    return !this.searchActive() && this.activeTab() === tab.type;
  }

  onTabClick(tab: LeftMenuTabView): void {
    if (tab.type === 'search') {
      this.searchSelected.emit();
      return;
    }
    this.tabSelected.emit(tab.type);
  }
}
