import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { selectGroupData } from '../../models/group-data';
import { fromGroupContent } from '../../store';
import { GroupMembersComponent } from './group-members.component';

@Component({
  selector: 'alg-group-members-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupMembersComponent ],
  template: `
    @if (groupData(); as groupData) {
      <alg-group-members [groupData]="groupData"
        (groupRefreshRequired)="onGroupRefreshRequired()"
        (removedGroup)="onNavRefreshRequired()"
       />
    }
  `,
})
export class GroupMembersPageComponent {
  private store = inject(Store);
  private currentContentService = inject(CurrentContentService);

  private readonly groupDataState = this.store.selectSignal(selectGroupData);

  protected readonly groupData = computed(() => {
    const state = this.groupDataState();
    return state.isReady ? state.data : undefined;
  });

  protected onGroupRefreshRequired(): void {
    this.store.dispatch(fromGroupContent.groupPageActions.refresh());
    this.currentContentService.forceNavMenuReload();
  }

  protected onNavRefreshRequired(): void {
    this.currentContentService.forceNavMenuReload();
  }
}
