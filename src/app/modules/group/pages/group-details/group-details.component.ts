import { Component, OnDestroy } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group, GetGroupByIdService } from '../../http-services/get-group-by-id.service';
import { ActivatedRoute } from '@angular/router';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  providers: [ GroupTabService ]
})
export class GroupDetailsComponent implements OnDestroy {

  group$ = this.groupTabService.group$.pipe(map(withManagementAdditions))
  state: 'loaded'|'loading'|'error' = 'loading';

  private subscription: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupTabService: GroupTabService,
    private getGroupByIdService: GetGroupByIdService,
    private currentContent: CurrentContentService,
  ) {
    this.subscription = groupTabService.refresh$.subscribe(() => this.fetchGroup(false));
    activatedRoute.paramMap.subscribe(params => {
      if (params.has('id')) this.fetchGroup(true);
    });
  }

  /**
   * (re)fetch the group data (and so refresh UI)
   * @param clearCurrent - whether the current group is cleared out (we display the loading spinner) or we refresh silently
   */
  fetchGroup(clearCurrent: boolean) {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id !== null) {
      if (clearCurrent) this.state = 'loading';
      this.getGroupByIdService
        .get(id)
        .subscribe(
          (g: Group) => {
            this.state = 'loaded';
            this.groupTabService.setGroup(g);
            this.currentContent.setCurrent({
              type: 'group',
              breadcrumbs: {
                category: 'Groups',
                path: [{ title: g.name }],
                currentPageIdx: 0,
              },
              title: g.name,
            });
          },
          _error => {
            this.state = 'error';
          }
        );
    } else {
      this.state = 'error'; // unexpected - the routing should not let this happen
    }
  }

  ngOnDestroy() {
    this.currentContent.setCurrent(null);
    this.subscription.unsubscribe();
  }

}
