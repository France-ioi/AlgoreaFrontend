import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { GroupLogViewComponent } from './group-log-view.component';

@Component({
  selector: 'alg-group-log-view-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupLogViewComponent, ErrorComponent ],
  template: `
    @if (group(); as group) {
      @if (group.currentUserCanWatchMembers) {
        <alg-group-log-view [groupId]="group.id"></alg-group-log-view>
      } @else {
        <alg-error>
          <ng-container i18n>
            You don't have permission to view this group's history.
          </ng-container>
        </alg-error>
      }
    }
  `,
})
export class GroupLogViewPageComponent {
  private store = inject(Store);

  protected readonly group = this.store.selectSignal(fromGroupContent.selectActiveContentGroup);
}
