import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group, GetGroupByIdService } from '../../http-services/get-group-by-id.service';
import { ActivatedRoute } from '@angular/router';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  providers: [ GroupTabService ]
})
export class GroupDetailsComponent {

  idFromRoute?: string;
  group?: Group & ManagementAdditions;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupTabService: GroupTabService,
    private getGroupByIdService: GetGroupByIdService
  ) {
    groupTabService.refresh$.subscribe(() => this.fetchGroup());
    activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id != null) {
        this.idFromRoute = id;
        this.fetchGroup();
      }
    });
  }

  fetchGroup() {
    if (this.idFromRoute) {
      this.getGroupByIdService
        .get(this.idFromRoute)
        .subscribe((g: Group) => {
          this.group = withManagementAdditions(g);
          this.groupTabService.group$.next(g);
        });
    }
  }

}
