import { Component, OnDestroy } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group, GetGroupByIdService } from '../../http-services/get-group-by-id.service';
import { ActivatedRoute } from '@angular/router';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  providers: [ GroupTabService ]
})
export class GroupDetailsComponent implements OnDestroy {

  idFromRoute?: string;
  group?: Group & ManagementAdditions;
  state: 'loaded'|'loading'|'error' = 'loading';

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupTabService: GroupTabService,
    private getGroupByIdService: GetGroupByIdService,
    private currentContent: CurrentContentService,
  ) {
    groupTabService.refresh$.subscribe(() => this.fetchGroup());
    activatedRoute.paramMap.subscribe((params) => {
      this.state = 'loading';
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
        .subscribe(
          (g: Group) => {
            this.group = withManagementAdditions(g);
            this.state = 'loaded';
            this.groupTabService.group$.next(g);
            this.currentContent.setPageInfo({
              category: 'Groups',
              breadcrumb: [{ title: g.name }],
              currentPageIndex: 0
            });
          },
          (_error) => {
            this.state = 'error';
          }
        );
    } else {
      this.state = 'error';
    }
  }

  ngOnDestroy() {
    this.currentContent.setPageInfo(null);
  }

}
