import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ManagementAdditions, withManagementAdditions } from '../../helpers/group-management';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-administration',
  templateUrl: './group-administration.component.html',
  styleUrls: [ './group-administration.component.scss' ]
})
export class GroupAdministrationComponent implements OnChanges{

  @Input() group?: Group;
  @Output() groupRefreshRequired = new EventEmitter<void>();
  groupWithPermissions?: Group & ManagementAdditions;

  ngOnChanges(): void {
    this.groupWithPermissions = this.group ? withManagementAdditions(this.group) : undefined;
  }

  refreshGroupInfo(): void {
    this.groupRefreshRequired.emit();
  }

}
