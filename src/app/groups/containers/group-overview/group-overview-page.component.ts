import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { fromGroupContent } from '../../store';
import { GroupOverviewComponent } from './group-overview.component';

@Component({
  selector: 'alg-group-overview-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupOverviewComponent ],
  template: `
    @if (group(); as group) {
      <alg-group-overview
        [group]="group"
        (groupRefreshRequired)="onGroupRefreshRequired()"
        (leftGroup)="onLeftGroup()"
      ></alg-group-overview>
    }
  `,
})
export class GroupOverviewPageComponent {
  private store = inject(Store);
  private currentContentService = inject(CurrentContentService);

  protected readonly group = this.store.selectSignal(fromGroupContent.selectActiveContentGroup);

  protected onGroupRefreshRequired(): void {
    this.store.dispatch(fromGroupContent.groupPageActions.refresh());
    this.currentContentService.forceNavMenuReload();
  }

  protected onLeftGroup(): void {
    this.currentContentService.forceNavMenuReload();
  }
}
