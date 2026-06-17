import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { GroupManagersComponent } from './group-managers.component';

@Component({
  selector: 'alg-group-managers-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupManagersComponent ],
  template: `
    @if (group(); as group) {
      <alg-group-managers [group]="group" />
    }
  `,
})
export class GroupManagersPageComponent {
  private store = inject(Store);

  protected readonly group = this.store.selectSignal(fromGroupContent.selectActiveContentGroup);
}
