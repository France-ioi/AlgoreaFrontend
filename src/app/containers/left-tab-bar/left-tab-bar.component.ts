import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export const communityTabIdx = 3;

@Component({
  selector: 'alg-left-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './left-tab-bar.component.html',
  styleUrls: [ './left-tab-bar.component.scss' ],
})
export class LeftTabBarComponent {
  activeTabIndex = input(0);
  skillsTabEnabled = input(false);
  groupsTabEnabled = input(false);
  communityTabEnabled = input(false);
  hasUnreadCommunityThreads = input(false);
  searchEnabled = input(false);
  searchActive = input(false);

  readonly communityTabIdx = communityTabIdx;

  tabSelected = output<number>();
  searchSelected = output<void>();
}
