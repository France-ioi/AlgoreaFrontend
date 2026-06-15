import { Component, input } from '@angular/core';
import { IsCurrentUserManagerPipe } from '../../models/group-management';
import { GroupManagerListComponent } from '../group-manager-list/group-manager-list.component';
import { IsCurrentUserMemberPipe } from '../../models/group-membership';
import { Group } from '../../models/group';

@Component({
  selector: 'alg-group-managers',
  templateUrl: './group-managers.component.html',
  styleUrls: [ './group-managers.component.scss' ],
  imports: [ GroupManagerListComponent, IsCurrentUserManagerPipe, IsCurrentUserMemberPipe ]
})
export class GroupManagersComponent {
  group = input.required<Group>();
}

