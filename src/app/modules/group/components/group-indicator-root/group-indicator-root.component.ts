import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-indicator-root',
  templateUrl: './group-indicator-root.component.html',
  styleUrls: [ './group-indicator-root.component.scss' ]
})
export class GroupIndicatorRootComponent {
  @Input() group?: Group;

  get showIndicator(): boolean {
    return this.group?.currentUserManagership !== 'none' || this.group?.currentUserMembership !== 'none';
  }

  constructor() { }
}
