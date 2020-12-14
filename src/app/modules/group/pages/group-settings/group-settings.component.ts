import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { canCurrentUserManageGroup } from '../../helpers/group-management';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: [ './group-settings.component.scss' ]
})
export class GroupSettingsComponent implements OnChanges {

  @Input() group?: Group;
  @Output() groupRefreshRequired = new EventEmitter<void>();
  authorized = false;

  ngOnChanges(): void {
    this.authorized = this.group ? canCurrentUserManageGroup(this.group) : false;
  }

  refreshGroupInfo(): void {
    this.groupRefreshRequired.emit();
  }

}
