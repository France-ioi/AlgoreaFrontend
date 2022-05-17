import { Component, ViewChild } from '@angular/core';
import { canCurrentUserManageGroup } from '../../helpers/group-management';
import { GroupDataSource } from '../../services/group-datasource.service';
import { GroupEditComponent } from '../group-edit/group-edit.component';
import { PendingChangesComponent } from '../../../../shared/guards/pending-changes-guard';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: [ './group-settings.component.scss' ]
})
export class GroupSettingsComponent implements PendingChangesComponent {
  @ViewChild('groupEdit') groupEdit?: GroupEditComponent;

  authorized$ = this.groupDataSource.state$.pipe(
    map(state => (state.data?.group ? canCurrentUserManageGroup(state.data.group) : false)),
  );

  constructor(private groupDataSource: GroupDataSource) {
  }

  isDirty(): boolean {
    return !!this.groupEdit?.isDirty();
  }

}
