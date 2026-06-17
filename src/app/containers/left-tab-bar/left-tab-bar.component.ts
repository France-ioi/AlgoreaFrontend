import { Component, input, output } from '@angular/core';
import { LeftMenuTabView } from '../../config/left-menu-config.service';

const tabClickDedupeMs = 400;

@Component({
  selector: 'alg-left-tab-bar',
  templateUrl: './left-tab-bar.component.html',
  styleUrls: [ './left-tab-bar.component.scss' ],
})
export class LeftTabBarComponent {
  tabs = input<LeftMenuTabView[]>([]);
  activeTab = input<number | null>(null);
  hasUnreadCommunityThreads = input(false);
  searchActive = input(false);

  tabSelected = output<number>();
  searchSelected = output<void>();

  private lastTabClick: { key: number | 'search', time: number } | null = null;

  isTabActive(tab: LeftMenuTabView): boolean {
    if (tab.type === 'search') {
      return this.searchActive();
    }
    return !this.searchActive() && this.activeTab() === tab.id;
  }

  onTabClick(tab: LeftMenuTabView): void {
    if (this.isDuplicateTabClick(tab)) return;

    if (tab.type === 'search') {
      this.searchSelected.emit();
      return;
    }
    this.tabSelected.emit(tab.id);
  }

  private isDuplicateTabClick(tab: LeftMenuTabView): boolean {
    const key = tab.type === 'search' ? 'search' : tab.id;
    const now = Date.now();
    if (this.lastTabClick?.key === key && now - this.lastTabClick.time < tabClickDedupeMs) {
      return true;
    }
    this.lastTabClick = { key, time: now };
    return false;
  }
}
