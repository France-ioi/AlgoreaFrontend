import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { GroupDataSource } from '../../services/group-datasource.service';

@Component({
  selector: 'alg-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: [ './group-edit.component.scss' ]
})
export class GroupEditComponent implements OnDestroy {

  subscriptions: Subscription[] = [];

  state$ = this.groupDataSource.state$;

  constructor(
    private currentContent: CurrentContentService,
    private groupDataSource: GroupDataSource,
  ) {
    this.currentContent.editState.next('editing');
  }

  ngOnDestroy(): void {
    this.currentContent.editState.next('non-editable');
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
