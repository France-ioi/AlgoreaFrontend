import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from 'src/app/shared/helpers/state';
import { CurrentContentService, EditAction, GroupInfo, isGroupInfo } from 'src/app/shared/services/current-content.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupDataSource } from '../../services/group-datasource.service';

const GroupBreadcrumbCat = 'Groups';

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
    private groupDataSource: GroupDataSource
  ) {

    // on route change: refetch group if needed
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      this.currentContent.current.next({
        id: id, type: 'group', breadcrumbs: { category: GroupBreadcrumbCat, path: [], currentPageIdx: -1 }
      } as GroupInfo);
      if (id) this.groupDataSource.fetchGroup(id);
    });

    // on state change, update current content page info (for breadcrumb)
    this.subscriptions.push(
      this.groupDataSource.state$.pipe(
      filter<Ready<Group>|Fetching|FetchError,Ready<Group>>(isReady),
      map(state => ({
        type: 'group',
        id: state.data.id,
        breadcrumbs: {
          category: GroupBreadcrumbCat,
          path: [{ title: state.data.name, navigateTo: [ 'groups', 'by-id', state.data.id, 'details' ] }],
          currentPageIdx: 0,
        },
        title: state.data.name,
      }))
    ).subscribe(p => this.currentContent.current.next(p)),

    this.currentContent.editAction$.pipe(filter(action => [ EditAction.StartEditing, EditAction.StopEditing ].includes(action)))
      .subscribe(action => {
        const currentInfo = this.currentContent.current.value;
        if (isGroupInfo(currentInfo)) {
          void this.router.navigate([ 'groups', 'by-id', currentInfo.id, action === EditAction.StartEditing ? 'edit' : 'details' ]);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
