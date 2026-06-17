import { Component, input, output } from '@angular/core';
import { LeftMenuTabView } from '../../config/left-menu-config.service';

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

  isTabActive(tab: LeftMenuTabView): boolean {
    if (tab.type === 'search') {
      return this.searchActive();
    }
    return !this.searchActive() && this.activeTab() === tab.id;
  }

  onTabClick(tab: LeftMenuTabView): void {
    if (tab.type === 'search') {
      this.searchSelected.emit();
      return;
    }
    this.tabSelected.emit(tab.id);
  }
}
