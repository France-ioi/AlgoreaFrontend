import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { GroupAccessComponent } from './group-access.component';

@Component({
  selector: 'alg-group-access-page',
  host: { class: 'alg-flex-1' },
  imports: [ GroupAccessComponent ],
  template: `
    @if (group(); as group) {
      <alg-group-access [group]="group"></alg-group-access>
    }
  `,
})
export class GroupAccessPageComponent {
  private store = inject(Store);

  protected readonly group = this.store.selectSignal(fromGroupContent.selectActiveContentGroup);
}
