import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { CanCurrentUserSetExtraTimePipe, IsTimeLimitedActivityPipe } from '../../models/time-limited-activity';
import { DurationToReadablePipe } from 'src/app/pipes/duration';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemExtraTimeForDescendantsComponent } from './item-extra-time-for-descendants/item-extra-time-for-descendants.component';

@Component({
  selector: 'alg-item-extra-time',
  standalone: true,
  imports: [
    IsTimeLimitedActivityPipe,
    CanCurrentUserSetExtraTimePipe,
    ItemExtraTimeForDescendantsComponent,
    DurationToReadablePipe,
    GroupIsUserPipe,
    ErrorComponent,
    LoadingComponent,
  ],
  templateUrl: './item-extra-time.component.html',
  styleUrl: './item-extra-time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemExtraTimeComponent {
  itemData = input.required<ItemData>();

  observedGroupInfoSignal = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  constructor(
    private store: Store,
  ) {}
}
