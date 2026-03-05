import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

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
  currentLanguage = input<string | undefined>();

  readonly communityTabIdx = communityTabIdx;

  tabSelected = output<number>();

  multiRow = computed(() => {
    const count = 1
      + (this.skillsTabEnabled() ? 1 : 0)
      + (this.groupsTabEnabled() ? 1 : 0)
      + (this.communityTabEnabled() ? 1 : 0);
    return count > 3;
  });
}
