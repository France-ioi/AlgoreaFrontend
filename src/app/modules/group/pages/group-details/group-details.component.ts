import { Component, OnDestroy } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: [ './group-details.component.scss' ],
})
export class GroupDetailsComponent implements OnDestroy {

  state$ = this.groupDataSource.state$;
  group$ = this.groupDataSource.group$.pipe(map(withManagementAdditions))

  private subscription: Subscription;

  constructor(
    private groupDataSource: GroupDataSource,
    private currentContent: CurrentContentService,
  ) {
    this.subscription = this.groupDataSource.group$.subscribe(
      group => this.currentContent.editState.next(group.current_user_is_manager ? 'editable' : 'non-editable')
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.currentContent.editState.next('non-editable');
  }
}
