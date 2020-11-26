import { Component, OnDestroy, ViewChild } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { withManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { Subscription } from 'rxjs';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'alg-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: [ './group-details.component.scss' ],
})
export class GroupDetailsComponent implements OnDestroy {

  state$ = this.groupDataSource.state$;
  group$ = this.groupDataSource.group$.pipe(map(withManagementAdditions))

  // use of ViewChild required as these elements are shown under some conditions, so may be undefined
  @ViewChild('overviewTab') overviewTab?: RouterLinkActive;
  @ViewChild('compositionTab') compositionTab?: RouterLinkActive;
  @ViewChild('adminTab') adminTab?: RouterLinkActive;
  @ViewChild('settingsTab') settingsTab?: RouterLinkActive;

  private subscription: Subscription;

  constructor(
    private groupDataSource: GroupDataSource,
    private currentContent: CurrentContentService,
  ) {
    this.subscription = this.group$.subscribe(
      group => this.currentContent.editState.next(group.current_user_is_manager ? 'editable' : 'non-editable')
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.currentContent.editState.next('non-editable');
  }

  onGroupRefreshRequired(): void {
    this.groupDataSource.refetchGroup();
  }
}
