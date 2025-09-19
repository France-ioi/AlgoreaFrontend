import { Component, inject } from '@angular/core';
import { JoinedGroupsService } from 'src/app/data-access/joined-groups.service';
import { mapStateData, mapToFetchState } from 'src/app/utils/operators/state';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RequirePersonalInfoAccessApproval as A } from 'src/app/groups/models/group-approvals';
import { GroupLinksComponent } from '../group-links/group-links.component';

@Component({
  selector: 'alg-user-groups-with-grants',
  templateUrl: './user-groups-with-grants.component.html',
  styleUrls: [ './user-groups-with-grants.component.scss' ],
  standalone: true,
  imports: [
    LoadingComponent,
    ErrorComponent,
    AsyncPipe,
    GroupLinksComponent,
  ],
})
export class UserGroupsWithGrantsComponent {

  private joinedGroupsService = inject(JoinedGroupsService);

  groupsWithPersonalInfoAccess = toSignal(this.joinedGroupsService.getJoinedGroupsWithPersonalInfoAccess().pipe(
    mapToFetchState(),
    mapStateData(groups => ({
      noGroupsMatching: groups.length === 0,
      groupsWithViewAccess: groups.filter(g => g.requirePersonalInfoAccessApproval === A.View),
      groupsWithEditAccess: groups.filter(g => g.requirePersonalInfoAccessApproval === A.Edit),
    })),
  ), { requireSync: true });

}
