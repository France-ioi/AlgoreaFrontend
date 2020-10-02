import { Component, OnDestroy } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { ActivatedRoute } from '@angular/router';
import { withManagementAdditions } from '../../helpers/group-management';
import { filter, map } from 'rxjs/operators';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { Subscription } from 'rxjs';
import { FetchError, Fetching, isReady, Ready } from 'src/app/shared/helpers/state';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  providers: [ GroupDataSource ]
})
export class GroupDetailsComponent implements OnDestroy {

  state$ = this.groupDataSource.state$;
  group$ = this.groupDataSource.group$.pipe(map(withManagementAdditions))

  private subscription: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupDataSource: GroupDataSource,
    private currentContent: CurrentContentService,
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      this.currentContent.setCurrent({ type: 'group' });
      if (id) this.groupDataSource.fetchGroup(id);
    });

    // on state change, update current content page info (for breadcrumb)
    this.subscription = this.groupDataSource.state$.pipe(
      filter<Ready<Group>|Fetching|FetchError,Ready<Group>>(isReady),
      map(state => ({
        type: 'group',
        breadcrumbs: {
          category: 'Groups',
          path: [{ title: state.data.name, navigateTo: ['groups', 'details', state.data.id] }],
          currentPageIdx:  0,
        },
        title: state.data.name,
      }))
    ).subscribe(p => this.currentContent.setCurrent(p));
  }

  ngOnDestroy() {
    this.currentContent.setCurrent(null);
    this.subscription.unsubscribe();
  }

}
