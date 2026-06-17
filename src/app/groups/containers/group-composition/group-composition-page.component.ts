import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { selectGroupData } from '../../models/group-data';
import { fromGroupContent } from '../../store';
import { GroupCompositionComponent } from './group-composition.component';

@Component({
  selector: 'alg-group-composition-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupCompositionComponent ],
  template: `
    @if (groupData(); as groupData) {
      <alg-group-composition
        [groupData]="groupData"
        (groupRefreshRequired)="onGroupRefreshRequired()"
        (addedGroup)="onNavRefreshRequired()"
        (removedGroup)="onNavRefreshRequired()"
      ></alg-group-composition>
    }
  `,
})
export class GroupCompositionPageComponent {
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
