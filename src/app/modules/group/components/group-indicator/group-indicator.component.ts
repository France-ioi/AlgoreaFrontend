import { Component, Input } from '@angular/core';
import { GroupShortInfo } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-indicator',
  templateUrl: './group-indicator.component.html',
  styleUrls: [ './group-indicator.component.scss' ]
})
export class GroupIndicatorComponent {
  @Input() currentUserMembership: string | undefined;
  @Input() currentUserManagership: string | undefined;
  @Input() membershipGroups: GroupShortInfo[] = [];
  @Input() managershipGroups: GroupShortInfo[] = [];

  constructor() { }
}
