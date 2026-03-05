import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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
  currentLanguage = input<string | undefined>();

  tabSelected = output<number>();
}
