import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { selectGroupData } from '../../models/group-data';
import { GroupSubGroupsComponent } from './group-sub-groups.component';

@Component({
  selector: 'alg-group-sub-groups-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupSubGroupsComponent ],
  template: `
    @if (groupData(); as groupData) {
      <alg-group-sub-groups [groupData]="groupData"
        (addedGroup)="onNavRefreshRequired()"
        (removedGroup)="onNavRefreshRequired()"
       />
    }
  `,
})
export class GroupSubGroupsPageComponent {
  private store = inject(Store);
  private currentContentService = inject(CurrentContentService);

  private readonly groupDataState = this.store.selectSignal(selectGroupData);

  protected readonly groupData = computed(() => {
    const state = this.groupDataState();
    return state.isReady ? state.data : undefined;
  });

  protected onNavRefreshRequired(): void {
    this.currentContentService.forceNavMenuReload();
  }
}
