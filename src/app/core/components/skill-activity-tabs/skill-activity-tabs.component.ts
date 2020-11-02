import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-skill-activity-tabs',
  templateUrl: './skill-activity-tabs.component.html',
  styleUrls: [ './skill-activity-tabs.component.scss' ],
})
export class SkillActivityTabsComponent {

  @Input() backgroundColor: 'dark' | 'light' = 'dark';

  constructor() {}
}
