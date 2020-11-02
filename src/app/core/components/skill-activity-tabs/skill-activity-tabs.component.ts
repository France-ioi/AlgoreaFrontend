import { Component, Input } from '@angular/core';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';

@Component({
  selector: 'alg-skill-activity-tabs',
  templateUrl: './skill-activity-tabs.component.html',
  styleUrls: [ './skill-activity-tabs.component.scss' ],
})
export class SkillActivityTabsComponent {

  @Input() currentUser?: UserProfile;

  constructor() {}
}
