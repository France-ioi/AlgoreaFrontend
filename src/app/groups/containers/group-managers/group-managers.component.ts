import { Component, Input } from '@angular/core';
import { IsCurrentUserManagerPipe } from '../../models/group-management';
import { GroupData } from '../../models/group-data';
import { GroupManagerListComponent } from '../group-manager-list/group-manager-list.component';

@Component({
  selector: 'alg-group-managers',
  templateUrl: './group-managers.component.html',
  styleUrls: [ './group-managers.component.scss' ],
  standalone: true,
  imports: [ GroupManagerListComponent, IsCurrentUserManagerPipe ],
})
export class GroupManagersComponent {
  @Input() groupData?: GroupData;
}

