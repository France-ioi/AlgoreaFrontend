import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { groupInfo, GroupInfo, isGroupInfo } from 'src/app/shared/models/content/group-info';
import { readyData } from 'src/app/shared/operators/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { GroupDataSource } from '../../services/group-datasource.service';

const GROUP_BREADCRUMB_CAT = $localize`Groups`;

/**
 * GroupByIdComponent is just a container for detail or edit page but manages the fetching on id change and (un)setting the current content.
 */
@Component({
  selector: 'alg-group-by-id',
  templateUrl: './group-by-id.component.html',
  styleUrls: [ './group-by-id.component.scss' ],
  providers: [ GroupDataSource ],
})
export class GroupByIdComponent implements OnDestroy {

  private subscriptions: Subscription[] = []; // subscriptions to be freed up on destroy

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
    private modeService: ModeService,
    private groupDataSource: GroupDataSource
  ) {

    // on route change: refetch group if needed
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.currentContent.current.next(groupInfo({
          route: { contentType: 'group', id: id, path: [] },
          breadcrumbs: { category: GROUP_BREADCRUMB_CAT, path: [], currentPageIdx: -1 }
        }));
        this.groupDataSource.fetchGroup(id);
      }
    });

    // on state change, update current content page info (for breadcrumb)
    this.subscriptions.push(
      this.groupDataSource.state$.pipe(
        readyData(),
        map((group):GroupInfo => groupInfo({
          route: { contentType: 'group', id: group.id, path: [] },
          breadcrumbs: {
            category: GROUP_BREADCRUMB_CAT,
            path: [{ title: group.name, navigateTo: this.router.createUrlTree([ 'groups', 'by-id', group.id, 'details' ]) }],
            currentPageIdx: 0,
          },
          title: group.name,
        }))
      ).subscribe(p => this.currentContent.current.next(p)),

      this.modeService.modeActions$.pipe(
        filter(action => [ ModeAction.StartEditing, ModeAction.StopEditing ].includes(action))
      ).subscribe(action => {
        const currentInfo = this.currentContent.current.value;
        if (!isGroupInfo(currentInfo)) throw new Error('Unexpected: in group-by-id but the current content is not a group');
        void this.router.navigate([ 'groups', 'by-id', currentInfo.route.id, action === ModeAction.StartEditing ? 'edit' : 'details' ]);
      })
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
